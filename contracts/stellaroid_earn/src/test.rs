#![cfg(test)]
use super::*;
use soroban_sdk::{
    symbol_short,
    testutils::{Address as _, Events},
    token, vec, Address, BytesN, Env, IntoVal, String,
};

struct Ctx<'a> {
    env: Env,
    client: StellaroidEarnClient<'a>,
    admin: Address,
    token_admin: token::StellarAssetClient<'a>,
    token_addr: Address,
}

fn setup<'a>() -> Ctx<'a> {
    let env = Env::default();
    let contract_id = env.register(StellaroidEarn, ());
    let client = StellaroidEarnClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token_addr = sac.address();
    let token_admin = token::StellarAssetClient::new(&env, &token_addr);

    Ctx {
        env,
        client,
        admin,
        token_admin,
        token_addr,
    }
}

fn text(env: &Env, value: &str) -> String {
    String::from_str(env, value)
}

fn register_issuer(ctx: &Ctx<'_>, issuer: &Address) {
    ctx.client.register_issuer(
        issuer,
        &text(&ctx.env, "Stellaroid Academy"),
        &text(&ctx.env, "https://stellaroid.dev"),
        &text(&ctx.env, "bootcamp"),
    );
}

fn approve_issuer(ctx: &Ctx<'_>, issuer: &Address) {
    ctx.client.approve_issuer(&ctx.admin, issuer);
}

fn register_certificate(
    ctx: &Ctx<'_>,
    issuer: &Address,
    student: &Address,
    hash: &BytesN<32>,
) {
    ctx.client.register_certificate(
        issuer,
        student,
        hash,
        &text(&ctx.env, "Stellar Smart Contract Bootcamp Completion"),
        &text(&ctx.env, "Stellar PH Bootcamp 2026"),
        &text(
            &ctx.env,
            "https://stellaroid-earn-demo.vercel.app/proof-metadata/sample.json",
        ),
    );
}

fn create_and_fund_opportunity(
    ctx: &Ctx<'_>,
    employer: &Address,
    candidate: &Address,
    hash: &BytesN<32>,
    amount: i128,
) -> u64 {
    let opp_id = ctx.client.create_opportunity(
        employer,
        candidate,
        hash,
        &text(&ctx.env, "Paid trial"),
        &amount,
        &2, // 2 milestones
    );
    ctx.token_admin.mint(employer, &amount);
    ctx.client.fund_opportunity(employer, &opp_id);
    opp_id
}

// T1 — Happy path: approved issuer registers + verifies, then admin rewards.
#[test]
fn t1_happy_path_with_approved_issuer() {
    let ctx = setup();
    ctx.env.mock_all_auths();
    ctx.client.init(&ctx.admin, &ctx.token_addr);

    let issuer = Address::generate(&ctx.env);
    let student = Address::generate(&ctx.env);
    let hash = BytesN::from_array(&ctx.env, &[1u8; 32]);

    register_issuer(&ctx, &issuer);
    approve_issuer(&ctx, &issuer);
    register_certificate(&ctx, &issuer, &student, &hash);
    ctx.client.verify_certificate(&issuer, &hash);

    let cert = ctx.client.get_certificate(&hash).unwrap();
    assert_eq!(cert.status, CredentialStatus::Verified);
    assert_eq!(
        cert.title,
        text(&ctx.env, "Stellar Smart Contract Bootcamp Completion")
    );

    ctx.token_admin.mint(&ctx.admin, &1_000);
    ctx.client.reward_student(&student, &hash, &500);

    let balance = token::Client::new(&ctx.env, &ctx.token_addr).balance(&student);
    assert_eq!(balance, 500);
}

// T2 — Pending issuers cannot publish credentials.
#[test]
fn t2_unapproved_issuer_cannot_issue() {
    let ctx = setup();
    ctx.env.mock_all_auths();
    ctx.client.init(&ctx.admin, &ctx.token_addr);

    let issuer = Address::generate(&ctx.env);
    let student = Address::generate(&ctx.env);
    let hash = BytesN::from_array(&ctx.env, &[2u8; 32]);

    register_issuer(&ctx, &issuer);

    let err = ctx
        .client
        .try_register_certificate(
            &issuer,
            &student,
            &hash,
            &text(&ctx.env, "Stellar Smart Contract Bootcamp Completion"),
            &text(&ctx.env, "Stellar PH Bootcamp 2026"),
            &text(
                &ctx.env,
                "https://stellaroid-earn-demo.vercel.app/proof-metadata/sample.json",
            ),
        )
        .err()
        .unwrap()
        .unwrap();
    assert_eq!(err, Error::IssuerNotApproved);
}

// T3 — Suspended issuers cannot publish new credentials.
#[test]
fn t3_suspended_issuer_cannot_issue() {
    let ctx = setup();
    ctx.env.mock_all_auths();
    ctx.client.init(&ctx.admin, &ctx.token_addr);

    let issuer = Address::generate(&ctx.env);
    let student = Address::generate(&ctx.env);
    let hash = BytesN::from_array(&ctx.env, &[3u8; 32]);

    register_issuer(&ctx, &issuer);
    approve_issuer(&ctx, &issuer);
    ctx.client.suspend_issuer(&ctx.admin, &issuer);

    let err = ctx
        .client
        .try_register_certificate(
            &issuer,
            &student,
            &hash,
            &text(&ctx.env, "Stellar Smart Contract Bootcamp Completion"),
            &text(&ctx.env, "Stellar PH Bootcamp 2026"),
            &text(
                &ctx.env,
                "https://stellaroid-earn-demo.vercel.app/proof-metadata/sample.json",
            ),
        )
        .err()
        .unwrap()
        .unwrap();
    assert_eq!(err, Error::IssuerSuspended);
}

// T4 — A different approved issuer cannot verify someone else's credential.
#[test]
fn t4_wrong_approved_issuer_cannot_verify() {
    let ctx = setup();
    ctx.env.mock_all_auths();
    ctx.client.init(&ctx.admin, &ctx.token_addr);

    let issuer_a = Address::generate(&ctx.env);
    let issuer_b = Address::generate(&ctx.env);
    let student = Address::generate(&ctx.env);
    let hash = BytesN::from_array(&ctx.env, &[4u8; 32]);

    register_issuer(&ctx, &issuer_a);
    register_issuer(&ctx, &issuer_b);
    approve_issuer(&ctx, &issuer_a);
    approve_issuer(&ctx, &issuer_b);

    register_certificate(&ctx, &issuer_a, &student, &hash);

    let err = ctx
        .client
        .try_verify_certificate(&issuer_b, &hash)
        .err()
        .unwrap()
        .unwrap();
    assert_eq!(err, Error::Unauthorized);
}

// T5 — Revocation persists and blocks downstream payments.
#[test]
fn t5_revoked_credential_blocks_payment() {
    let ctx = setup();
    ctx.env.mock_all_auths();
    ctx.client.init(&ctx.admin, &ctx.token_addr);

    let issuer = Address::generate(&ctx.env);
    let student = Address::generate(&ctx.env);
    let employer = Address::generate(&ctx.env);
    let hash = BytesN::from_array(&ctx.env, &[5u8; 32]);

    register_issuer(&ctx, &issuer);
    approve_issuer(&ctx, &issuer);
    register_certificate(&ctx, &issuer, &student, &hash);
    ctx.client.verify_certificate(&issuer, &hash);
    ctx.client.revoke_certificate(&issuer, &hash);

    let cert = ctx.client.get_certificate(&hash).unwrap();
    assert_eq!(cert.status, CredentialStatus::Revoked);

    let err = ctx
        .client
        .try_link_payment(&employer, &student, &hash, &250)
        .err()
        .unwrap()
        .unwrap();
    assert_eq!(err, Error::CredentialRevoked);
}

// T6 — Issuer registration and approval emit events.
#[test]
fn t6_issuer_events_emit() {
    let ctx = setup();
    ctx.env.mock_all_auths();
    let e = &ctx.env;
    let contract_id = ctx.client.address.clone();

    ctx.client.init(&ctx.admin, &ctx.token_addr);
    assert_eq!(
        ctx.env.events().all(),
        vec![
            e,
            (contract_id.clone(), (symbol_short!("init"),).into_val(e), ctx.admin.into_val(e)),
        ]
    );

    let issuer = Address::generate(&ctx.env);
    register_issuer(&ctx, &issuer);
    assert_eq!(
        ctx.env.events().all(),
        vec![
            e,
            (contract_id.clone(), (symbol_short!("iss_reg"),).into_val(e), issuer.into_val(e)),
        ]
    );

    approve_issuer(&ctx, &issuer);
    assert_eq!(
        ctx.env.events().all(),
        vec![
            e,
            (contract_id.clone(), (symbol_short!("iss_appr"),).into_val(e), issuer.into_val(e)),
        ]
    );
}

// T7 — Full opportunity lifecycle: create → fund → submit → approve → release.
#[test]
fn t7_opportunity_happy_path() {
    let ctx = setup();
    ctx.env.mock_all_auths();
    ctx.client.init(&ctx.admin, &ctx.token_addr);

    let issuer = Address::generate(&ctx.env);
    let student = Address::generate(&ctx.env);
    let employer = Address::generate(&ctx.env);
    let hash = BytesN::from_array(&ctx.env, &[7u8; 32]);

    register_issuer(&ctx, &issuer);
    approve_issuer(&ctx, &issuer);
    register_certificate(&ctx, &issuer, &student, &hash);
    ctx.client.verify_certificate(&issuer, &hash);

    let opp_id = create_and_fund_opportunity(&ctx, &employer, &student, &hash, 1_000);

    let opp = ctx.client.get_opportunity(&opp_id).unwrap();
    assert_eq!(opp.status, OpportunityStatus::Funded);
    assert_eq!(opp.amount, 1_000);

    // Milestone 1: submit + approve
    ctx.client.submit_milestone(&student, &opp_id);
    ctx.client.approve_milestone(&employer, &opp_id);
    let opp = ctx.client.get_opportunity(&opp_id).unwrap();
    assert_eq!(opp.status, OpportunityStatus::InProgress);
    assert_eq!(opp.current_milestone, 1);

    // Milestone 2 (final): submit + approve
    ctx.client.submit_milestone(&student, &opp_id);
    ctx.client.approve_milestone(&employer, &opp_id);
    let opp = ctx.client.get_opportunity(&opp_id).unwrap();
    assert_eq!(opp.status, OpportunityStatus::Approved);

    // Release payment
    ctx.client.release_payment(&employer, &opp_id);
    let opp = ctx.client.get_opportunity(&opp_id).unwrap();
    assert_eq!(opp.status, OpportunityStatus::Released);

    let balance = token::Client::new(&ctx.env, &ctx.token_addr).balance(&student);
    assert_eq!(balance, 1_000);
}

// T8 — Revoked credential cannot be used to create an opportunity.
#[test]
fn t8_revoked_credential_blocks_opportunity() {
    let ctx = setup();
    ctx.env.mock_all_auths();
    ctx.client.init(&ctx.admin, &ctx.token_addr);

    let issuer = Address::generate(&ctx.env);
    let student = Address::generate(&ctx.env);
    let employer = Address::generate(&ctx.env);
    let hash = BytesN::from_array(&ctx.env, &[8u8; 32]);

    register_issuer(&ctx, &issuer);
    approve_issuer(&ctx, &issuer);
    register_certificate(&ctx, &issuer, &student, &hash);
    ctx.client.verify_certificate(&issuer, &hash);
    ctx.client.revoke_certificate(&issuer, &hash);

    let err = ctx
        .client
        .try_create_opportunity(
            &employer,
            &student,
            &hash,
            &text(&ctx.env, "Paid trial"),
            &1_000,
            &1,
        )
        .err()
        .unwrap()
        .unwrap();
    assert_eq!(err, Error::CredentialRevoked);
}

// T9 — Employer can refund a funded opportunity.
#[test]
fn t9_refund_funded_opportunity() {
    let ctx = setup();
    ctx.env.mock_all_auths();
    ctx.client.init(&ctx.admin, &ctx.token_addr);

    let issuer = Address::generate(&ctx.env);
    let student = Address::generate(&ctx.env);
    let employer = Address::generate(&ctx.env);
    let hash = BytesN::from_array(&ctx.env, &[9u8; 32]);

    register_issuer(&ctx, &issuer);
    approve_issuer(&ctx, &issuer);
    register_certificate(&ctx, &issuer, &student, &hash);
    ctx.client.verify_certificate(&issuer, &hash);

    let opp_id = create_and_fund_opportunity(&ctx, &employer, &student, &hash, 500);

    ctx.client.refund_opportunity(&employer, &opp_id);
    let opp = ctx.client.get_opportunity(&opp_id).unwrap();
    assert_eq!(opp.status, OpportunityStatus::Refunded);

    let employer_balance = token::Client::new(&ctx.env, &ctx.token_addr).balance(&employer);
    assert_eq!(employer_balance, 500);
}

// T10 — Cannot release payment from non-Approved status.
#[test]
fn t10_invalid_status_transitions_fail() {
    let ctx = setup();
    ctx.env.mock_all_auths();
    ctx.client.init(&ctx.admin, &ctx.token_addr);

    let issuer = Address::generate(&ctx.env);
    let student = Address::generate(&ctx.env);
    let employer = Address::generate(&ctx.env);
    let hash = BytesN::from_array(&ctx.env, &[10u8; 32]);

    register_issuer(&ctx, &issuer);
    approve_issuer(&ctx, &issuer);
    register_certificate(&ctx, &issuer, &student, &hash);
    ctx.client.verify_certificate(&issuer, &hash);

    let opp_id = create_and_fund_opportunity(&ctx, &employer, &student, &hash, 300);

    // Cannot release directly from Funded (skipping milestones)
    let err = ctx
        .client
        .try_release_payment(&employer, &opp_id)
        .err()
        .unwrap()
        .unwrap();
    assert_eq!(err, Error::InvalidOpportunityStatus);

    // Cannot refund after approval
    ctx.client.submit_milestone(&student, &opp_id);
    ctx.client.approve_milestone(&employer, &opp_id);
    ctx.client.submit_milestone(&student, &opp_id);
    ctx.client.approve_milestone(&employer, &opp_id);

    let err = ctx
        .client
        .try_refund_opportunity(&employer, &opp_id)
        .err()
        .unwrap()
        .unwrap();
    assert_eq!(err, Error::InvalidOpportunityStatus);
}

// T11 — Opportunity milestone count is capped to prevent unbounded rendering and work.
#[test]
fn t11_rejects_too_many_opportunity_milestones() {
    let ctx = setup();
    ctx.env.mock_all_auths();
    ctx.client.init(&ctx.admin, &ctx.token_addr);

    let issuer = Address::generate(&ctx.env);
    let student = Address::generate(&ctx.env);
    let employer = Address::generate(&ctx.env);
    let hash = BytesN::from_array(&ctx.env, &[11u8; 32]);

    register_issuer(&ctx, &issuer);
    approve_issuer(&ctx, &issuer);
    register_certificate(&ctx, &issuer, &student, &hash);
    ctx.client.verify_certificate(&issuer, &hash);

    let err = ctx
        .client
        .try_create_opportunity(
            &employer,
            &student,
            &hash,
            &text(&ctx.env, "Paid trial"),
            &1_000,
            &25,
        )
        .err()
        .unwrap()
        .unwrap();
    assert_eq!(err, Error::InvalidMilestone);
}

// T12 — Employer can refund after candidate submission to avoid escrow lock.
#[test]
fn t12_employer_can_refund_submitted_opportunity() {
    let ctx = setup();
    ctx.env.mock_all_auths();
    ctx.client.init(&ctx.admin, &ctx.token_addr);

    let issuer = Address::generate(&ctx.env);
    let student = Address::generate(&ctx.env);
    let employer = Address::generate(&ctx.env);
    let hash = BytesN::from_array(&ctx.env, &[12u8; 32]);

    register_issuer(&ctx, &issuer);
    approve_issuer(&ctx, &issuer);
    register_certificate(&ctx, &issuer, &student, &hash);
    ctx.client.verify_certificate(&issuer, &hash);

    let opp_id = create_and_fund_opportunity(&ctx, &employer, &student, &hash, 700);
    ctx.client.submit_milestone(&student, &opp_id);
    ctx.client.refund_opportunity(&employer, &opp_id);

    let opp = ctx.client.get_opportunity(&opp_id).unwrap();
    assert_eq!(opp.status, OpportunityStatus::Refunded);

    let employer_balance = token::Client::new(&ctx.env, &ctx.token_addr).balance(&employer);
    assert_eq!(employer_balance, 700);
}
