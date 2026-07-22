#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, BytesN,
    Env, String,
};

// Persistent certificate records survive beyond a single tx burst;
// Admin/Token live in instance storage because they are read by every mutation.
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Token,
    Issuer(Address),
    Cert(BytesN<32>),
    NextOpportunityId,
    Opportunity(u64),
}

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum IssuerStatus {
    Pending,
    Approved,
    Suspended,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum CredentialStatus {
    Issued,
    Verified,
    Revoked,
    Suspended,
    Expired,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum OpportunityStatus {
    Draft,
    Funded,
    InProgress,
    Submitted,
    Approved,
    Released,
    Refunded,
    Cancelled,
}

#[contracttype]
#[derive(Clone)]
pub struct Issuer {
    pub address: Address,
    pub name: String,
    pub website: String,
    pub category: String,
    pub status: IssuerStatus,
}

#[contracttype]
#[derive(Clone)]
pub struct Credential {
    pub owner: Address,
    pub issuer: Address,
    pub title: String,
    pub cohort: String,
    pub metadata_uri: String,
    pub status: CredentialStatus,
    pub issued_at: u64,
    pub verified_at: u64,
    pub expires_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct Opportunity {
    pub id: u64,
    pub employer: Address,
    pub candidate: Address,
    pub cert_hash: BytesN<32>,
    pub title: String,
    pub amount: i128,
    pub status: OpportunityStatus,
    pub milestone_count: u32,
    pub current_milestone: u32,
}

// Human-readable error variants — the frontend maps these to copy,
// never surfacing raw HostError / ScVal to the user.
#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    AlreadyExists = 4,
    NotFound = 5,
    InvalidAmount = 6,
    IssuerNotFound = 7,
    IssuerNotApproved = 8,
    IssuerSuspended = 9,
    InvalidStatus = 10,
    CredentialRevoked = 11,
    CredentialExpired = 12,
    OpportunityNotFound = 13,
    AlreadyFunded = 14,
    InvalidMilestone = 15,
    InvalidOpportunityStatus = 16,
    PaymentLocked = 17,
}

// ~30d / ~60d in testnet ledgers — keeps certificates alive through a bootcamp demo window.
const TTL_THRESHOLD: u32 = 518_400;
const TTL_EXTEND: u32 = 1_036_800;
const MAX_MILESTONE_COUNT: u32 = 24;

#[contract]
pub struct StellaroidEarn;

#[contractimpl]
impl StellaroidEarn {
    /// One-shot bootstrap: admin funds rewards and holds the token treasury.
    pub fn init(env: Env, admin: Address, token: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND);
        env.events().publish((symbol_short!("init"),), admin);
        Ok(())
    }

    /// Issuers self-register, then wait for the admin to approve them before
    /// they can publish or verify credentials.
    pub fn register_issuer(
        env: Env,
        issuer: Address,
        name: String,
        website: String,
        category: String,
    ) -> Result<(), Error> {
        issuer.require_auth();

        let key = DataKey::Issuer(issuer.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::AlreadyExists);
        }

        let record = Issuer {
            address: issuer.clone(),
            name,
            website,
            category,
            status: IssuerStatus::Pending,
        };
        env.storage().persistent().set(&key, &record);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
        env.events().publish((symbol_short!("iss_reg"),), issuer);
        Ok(())
    }

    pub fn approve_issuer(env: Env, admin: Address, issuer: Address) -> Result<(), Error> {
        require_admin(&env, &admin)?;

        let key = DataKey::Issuer(issuer.clone());
        let mut record = load_issuer(&env, &issuer)?;
        record.status = IssuerStatus::Approved;
        env.storage().persistent().set(&key, &record);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
        env.events().publish((symbol_short!("iss_appr"),), issuer);
        Ok(())
    }

    pub fn suspend_issuer(env: Env, admin: Address, issuer: Address) -> Result<(), Error> {
        require_admin(&env, &admin)?;

        let key = DataKey::Issuer(issuer.clone());
        let mut record = load_issuer(&env, &issuer)?;
        record.status = IssuerStatus::Suspended;
        env.storage().persistent().set(&key, &record);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
        env.events().publish((symbol_short!("iss_susp"),), issuer);
        Ok(())
    }

    pub fn get_issuer(env: Env, issuer: Address) -> Option<Issuer> {
        env.storage().persistent().get(&DataKey::Issuer(issuer))
    }

    /// Issuer registers a certificate hash bound to a student wallet.
    /// Duplicate hashes are rejected — that is the tamper / double-issuance guard.
    pub fn register_certificate(
        env: Env,
        issuer: Address,
        student: Address,
        cert_hash: BytesN<32>,
        title: String,
        cohort: String,
        metadata_uri: String,
    ) -> Result<(), Error> {
        issuer.require_auth();
        ensure_issuer_can_operate(&load_issuer(&env, &issuer)?)?;

        let key = DataKey::Cert(cert_hash.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::AlreadyExists);
        }

        let cert = Credential {
            owner: student.clone(),
            issuer: issuer.clone(),
            title,
            cohort,
            metadata_uri,
            status: CredentialStatus::Issued,
            issued_at: env.ledger().timestamp(),
            verified_at: 0,
            expires_at: 0,
        };
        env.storage().persistent().set(&key, &cert);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);

        env.events()
            .publish((symbol_short!("cert_reg"), student), cert_hash);
        Ok(())
    }

    /// Only the admin or the approved issuing organization can mark a
    /// credential verified. Verification is no longer public-by-default.
    pub fn verify_certificate(
        env: Env,
        verifier: Address,
        cert_hash: BytesN<32>,
    ) -> Result<(), Error> {
        verifier.require_auth();

        let key = DataKey::Cert(cert_hash.clone());
        let mut cert = load_credential(&env, &cert_hash)?;
        authorize_verifier(&env, &verifier, &cert)?;
        ensure_not_expired(&env, &cert)?;

        if cert.status != CredentialStatus::Issued {
            return Err(status_error(&cert.status));
        }

        cert.status = CredentialStatus::Verified;
        cert.verified_at = env.ledger().timestamp();
        env.storage().persistent().set(&key, &cert);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
        env.events()
            .publish((symbol_short!("cert_ver"), cert.owner), cert_hash);
        Ok(())
    }

    pub fn revoke_certificate(
        env: Env,
        actor: Address,
        cert_hash: BytesN<32>,
    ) -> Result<(), Error> {
        actor.require_auth();

        let key = DataKey::Cert(cert_hash.clone());
        let mut cert = load_credential(&env, &cert_hash)?;
        authorize_credential_actor(&env, &actor, &cert)?;
        cert.status = CredentialStatus::Revoked;
        env.storage().persistent().set(&key, &cert);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
        env.events()
            .publish((symbol_short!("cert_rev"), cert.owner), cert_hash);
        Ok(())
    }

    pub fn suspend_certificate(
        env: Env,
        actor: Address,
        cert_hash: BytesN<32>,
    ) -> Result<(), Error> {
        actor.require_auth();

        let key = DataKey::Cert(cert_hash.clone());
        let mut cert = load_credential(&env, &cert_hash)?;
        authorize_credential_actor(&env, &actor, &cert)?;
        cert.status = CredentialStatus::Suspended;
        env.storage().persistent().set(&key, &cert);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
        env.events()
            .publish((symbol_short!("cert_sup"), cert.owner), cert_hash);
        Ok(())
    }

    /// Admin-triggered XLM/SAC reward to a student whose cert is registered.
    /// The token client handles the actual transfer; we only gate + emit.
    pub fn reward_student(
        env: Env,
        student: Address,
        cert_hash: BytesN<32>,
        amount: i128,
    ) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();

        let key = DataKey::Cert(cert_hash);
        let cert: Credential = env.storage().persistent().get(&key).ok_or(Error::NotFound)?;
        ensure_payable(&env, &cert, &student)?;

        let token_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(Error::NotInitialized)?;
        token::Client::new(&env, &token_addr).transfer(&admin, &student, &amount);

        env.events()
            .publish((symbol_short!("reward"), student), amount);
        Ok(())
    }

    /// Employer pays a verified student directly via the configured token.
    /// Employer authorizes the transfer — contract is just the coordination layer.
    pub fn link_payment(
        env: Env,
        employer: Address,
        student: Address,
        cert_hash: BytesN<32>,
        amount: i128,
    ) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        employer.require_auth();

        let cert: Credential = env
            .storage()
            .persistent()
            .get(&DataKey::Cert(cert_hash))
            .ok_or(Error::NotFound)?;
        ensure_payable(&env, &cert, &student)?;

        let token_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(Error::NotInitialized)?;
        token::Client::new(&env, &token_addr).transfer(&employer, &student, &amount);

        env.events()
            .publish((symbol_short!("payment"), employer), amount);
        Ok(())
    }

    pub fn get_certificate(env: Env, cert_hash: BytesN<32>) -> Option<Credential> {
        env.storage().persistent().get(&DataKey::Cert(cert_hash))
    }

    /// Employer creates a paid trial opportunity linked to a verified credential.
    /// The opportunity starts in Draft status — employer must fund it next.
    pub fn create_opportunity(
        env: Env,
        employer: Address,
        candidate: Address,
        cert_hash: BytesN<32>,
        title: String,
        amount: i128,
        milestone_count: u32,
    ) -> Result<u64, Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        employer.require_auth();

        let cert = load_credential(&env, &cert_hash)?;
        ensure_not_expired(&env, &cert)?;
        if cert.owner != candidate {
            return Err(Error::Unauthorized);
        }
        match cert.status {
            CredentialStatus::Verified => {}
            CredentialStatus::Revoked => return Err(Error::CredentialRevoked),
            CredentialStatus::Expired => return Err(Error::CredentialExpired),
            _ => return Err(Error::InvalidStatus),
        }

        let normalized_milestone_count = if milestone_count == 0 { 1 } else { milestone_count };
        if normalized_milestone_count > MAX_MILESTONE_COUNT {
            return Err(Error::InvalidMilestone);
        }

        let id = next_opportunity_id(&env);
        let opp = Opportunity {
            id,
            employer: employer.clone(),
            candidate,
            cert_hash,
            title,
            amount,
            status: OpportunityStatus::Draft,
            milestone_count: normalized_milestone_count,
            current_milestone: 0,
        };
        let key = DataKey::Opportunity(id);
        env.storage().persistent().set(&key, &opp);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
        env.events()
            .publish((symbol_short!("opp_crt"), employer), id);
        Ok(id)
    }

    /// Employer funds the opportunity by transferring the escrowed amount to the contract.
    pub fn fund_opportunity(env: Env, employer: Address, opp_id: u64) -> Result<(), Error> {
        employer.require_auth();

        let key = DataKey::Opportunity(opp_id);
        let mut opp: Opportunity = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::OpportunityNotFound)?;
        if opp.employer != employer {
            return Err(Error::Unauthorized);
        }
        if opp.status != OpportunityStatus::Draft {
            return Err(Error::AlreadyFunded);
        }

        let token_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(Error::NotInitialized)?;

        // Checks-effects-interactions: persist the new status BEFORE the external
        // token transfer, so a re-entrant token callback sees Funded and fails
        // the Draft guard. The transfer stays inside this atomic tx, so if it
        // fails the status write is rolled back with it.
        opp.status = OpportunityStatus::Funded;
        env.storage().persistent().set(&key, &opp);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);

        token::Client::new(&env, &token_addr).transfer(
            &employer,
            &env.current_contract_address(),
            &opp.amount,
        );

        env.events()
            .publish((symbol_short!("opp_fund"), employer), opp_id);
        Ok(())
    }

    /// Candidate marks the current milestone as submitted for employer review.
    pub fn submit_milestone(env: Env, candidate: Address, opp_id: u64) -> Result<(), Error> {
        candidate.require_auth();

        let key = DataKey::Opportunity(opp_id);
        let mut opp: Opportunity = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::OpportunityNotFound)?;
        if opp.candidate != candidate {
            return Err(Error::Unauthorized);
        }
        match opp.status {
            OpportunityStatus::Funded | OpportunityStatus::InProgress => {}
            _ => return Err(Error::InvalidOpportunityStatus),
        }

        opp.status = OpportunityStatus::Submitted;
        env.storage().persistent().set(&key, &opp);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
        env.events()
            .publish((symbol_short!("mile_sub"), candidate), opp_id);
        Ok(())
    }

    /// Employer approves the current milestone. If all milestones are done,
    /// the opportunity moves to Approved (ready for release).
    pub fn approve_milestone(env: Env, employer: Address, opp_id: u64) -> Result<(), Error> {
        employer.require_auth();

        let key = DataKey::Opportunity(opp_id);
        let mut opp: Opportunity = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::OpportunityNotFound)?;
        if opp.employer != employer {
            return Err(Error::Unauthorized);
        }
        if opp.status != OpportunityStatus::Submitted {
            return Err(Error::InvalidOpportunityStatus);
        }

        opp.current_milestone += 1;
        if opp.current_milestone >= opp.milestone_count {
            opp.status = OpportunityStatus::Approved;
        } else {
            opp.status = OpportunityStatus::InProgress;
        }
        env.storage().persistent().set(&key, &opp);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
        env.events()
            .publish((symbol_short!("mile_apr"), employer), opp_id);
        Ok(())
    }

    /// Employer releases the escrowed funds to the candidate after final approval.
    pub fn release_payment(env: Env, employer: Address, opp_id: u64) -> Result<(), Error> {
        employer.require_auth();

        let key = DataKey::Opportunity(opp_id);
        let mut opp: Opportunity = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::OpportunityNotFound)?;
        if opp.employer != employer {
            return Err(Error::Unauthorized);
        }
        if opp.status != OpportunityStatus::Approved {
            return Err(Error::InvalidOpportunityStatus);
        }

        let token_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(Error::NotInitialized)?;

        // Checks-effects-interactions: mark Released and persist BEFORE paying
        // out, so a re-entrant token cannot clear the Approved guard twice and
        // double-spend the pooled escrow.
        opp.status = OpportunityStatus::Released;
        env.storage().persistent().set(&key, &opp);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);

        token::Client::new(&env, &token_addr).transfer(
            &env.current_contract_address(),
            &opp.candidate,
            &opp.amount,
        );

        env.events().publish(
            (symbol_short!("pay_rel"), employer),
            opp_id,
        );
        Ok(())
    }

    /// Employer reclaims escrowed funds. Submitted work can still be rejected by
    /// refunding so a candidate cannot lock escrow by submitting unacceptable work.
    pub fn refund_opportunity(env: Env, employer: Address, opp_id: u64) -> Result<(), Error> {
        employer.require_auth();

        let key = DataKey::Opportunity(opp_id);
        let mut opp: Opportunity = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::OpportunityNotFound)?;
        if opp.employer != employer {
            return Err(Error::Unauthorized);
        }
        match opp.status {
            OpportunityStatus::Funded | OpportunityStatus::InProgress | OpportunityStatus::Submitted => {}
            _ => return Err(Error::InvalidOpportunityStatus),
        }

        let token_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(Error::NotInitialized)?;

        // Checks-effects-interactions: persist Refunded BEFORE the payout so a
        // re-entrant token sees the terminal status and fails the guard.
        opp.status = OpportunityStatus::Refunded;
        env.storage().persistent().set(&key, &opp);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);

        token::Client::new(&env, &token_addr).transfer(
            &env.current_contract_address(),
            &opp.employer,
            &opp.amount,
        );

        env.events().publish(
            (symbol_short!("pay_ref"), employer),
            opp_id,
        );
        Ok(())
    }

    pub fn get_opportunity(env: Env, opp_id: u64) -> Option<Opportunity> {
        env.storage()
            .persistent()
            .get(&DataKey::Opportunity(opp_id))
    }
}

fn get_admin(env: &Env) -> Result<Address, Error> {
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(Error::NotInitialized)
}

fn require_admin(env: &Env, admin: &Address) -> Result<(), Error> {
    admin.require_auth();
    if *admin != get_admin(env)? {
        return Err(Error::Unauthorized);
    }
    Ok(())
}

fn load_issuer(env: &Env, issuer: &Address) -> Result<Issuer, Error> {
    env.storage()
        .persistent()
        .get(&DataKey::Issuer(issuer.clone()))
        .ok_or(Error::IssuerNotFound)
}

fn ensure_issuer_can_operate(issuer: &Issuer) -> Result<(), Error> {
    match issuer.status {
        IssuerStatus::Approved => Ok(()),
        IssuerStatus::Pending => Err(Error::IssuerNotApproved),
        IssuerStatus::Suspended => Err(Error::IssuerSuspended),
    }
}

fn load_credential(env: &Env, cert_hash: &BytesN<32>) -> Result<Credential, Error> {
    env.storage()
        .persistent()
        .get(&DataKey::Cert(cert_hash.clone()))
        .ok_or(Error::NotFound)
}

fn authorize_verifier(env: &Env, verifier: &Address, cert: &Credential) -> Result<(), Error> {
    if *verifier == get_admin(env)? {
        return Ok(());
    }
    if *verifier != cert.issuer {
        return Err(Error::Unauthorized);
    }
    ensure_issuer_can_operate(&load_issuer(env, verifier)?)
}

fn authorize_credential_actor(
    env: &Env,
    actor: &Address,
    cert: &Credential,
) -> Result<(), Error> {
    if *actor == get_admin(env)? || *actor == cert.issuer {
        return Ok(());
    }
    Err(Error::Unauthorized)
}

fn ensure_not_expired(env: &Env, cert: &Credential) -> Result<(), Error> {
    if cert.expires_at != 0 && cert.expires_at <= env.ledger().timestamp() {
        return Err(Error::CredentialExpired);
    }
    Ok(())
}

fn ensure_payable(env: &Env, cert: &Credential, student: &Address) -> Result<(), Error> {
    if cert.owner != *student {
        return Err(Error::Unauthorized);
    }
    ensure_not_expired(env, cert)?;
    match cert.status {
        CredentialStatus::Verified => Ok(()),
        CredentialStatus::Revoked => Err(Error::CredentialRevoked),
        CredentialStatus::Expired => Err(Error::CredentialExpired),
        _ => Err(Error::InvalidStatus),
    }
}

fn status_error(status: &CredentialStatus) -> Error {
    match status {
        CredentialStatus::Revoked => Error::CredentialRevoked,
        CredentialStatus::Expired => Error::CredentialExpired,
        _ => Error::InvalidStatus,
    }
}

fn next_opportunity_id(env: &Env) -> u64 {
    let key = DataKey::NextOpportunityId;
    let id: u64 = env.storage().instance().get(&key).unwrap_or(0);
    env.storage().instance().set(&key, &(id + 1));
    id
}

#[cfg(test)]
mod test;
