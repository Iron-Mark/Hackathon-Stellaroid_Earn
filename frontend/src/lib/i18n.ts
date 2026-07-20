import type { Locale } from "@/components/layout/locale-toggle";

export type I18nDict = {
  hero: {
    eyebrow: string;
    h1a: string;
    h1b: string;
    lede: string;
    ctaPrimary: string;
    ctaGhost: string;
    personas: Array<{
      label: string;
      title: string;
      body: string;
      cta: string;
    }>;
  };
  footer: {
    tagline: string;
  };
  about: {
    lede: string;
    problemKicker: string;
    approachKicker: string;
  };
  app: {
    connectTitle: string;
    connectSubtitle: string;
    issuerLabel: string;
    issuerDesc: string;
    employerLabel: string;
    employerDesc: string;
    issuerRegisterTitle: string;
    issuerRegisterSubtitle: string;
    issuerDoneTitle: string;
    issuerDoneSubtitle: string;
    verifyTitle: string;
    verifySubtitle: string;
    employerWaitTitle: string;
    employerWaitSubtitle: string;
    payTitle: string;
    paySubtitle: string;
    doneTitle: string;
    doneSubtitle: string;
    roleHintIssuer: string;
    roleHintEmployer: string;
  };
};

export const i18n: Record<Locale, I18nDict> = {
  en: {
    hero: {
      eyebrow: "Stellar Testnet / Soroban / Freighter",
      h1a: "Verify credentials.",
      h1b: "Settle payment in one flow.",
      lede: "Stellaroid Earn anchors certificate hashes on Stellar so employers can inspect the record and pay the graduate without leaving the workflow once an approved issuer or admin verifies it. No email thread, no invoice delay, no platform fee.",
      ctaPrimary: "Try the app →",
      ctaGhost: "Take the 2-min demo, no wallet needed →",
      personas: [
        {
          label: "Issue",
          title: "For bootcamps and issuers",
          body: "Register a certificate hash, verify it with an approved wallet, and keep the proof audit-ready.",
          cta: "Start issuing",
        },
        {
          label: "Verify",
          title: "For recruiters and reviewers",
          body: "Paste a hash, inspect the public proof page, and download a recruiter-safe summary.",
          cta: "Look up a proof",
        },
        {
          label: "Hire",
          title: "For employers",
          body: "Review a verified graduate and fund a paid trial tied to the credential record.",
          cta: "Fund a trial",
        },
      ],
    },
    footer: {
      tagline:
        "On-chain credential registry on Stellar testnet. Built for the Stellar PH Bootcamp 2026.",
    },
    about: {
      lede: "A thin piece of software around one idea: certificates should be verifiable in seconds, not emails. And if they're verifiable, the grad should get paid on the same tap.",
      problemKicker:
        "The certificate is real. The problem is that proving it costs more than hiring around it.",
      approachKicker:
        "The canonical output isn't the UI; it's the event stream on stellar.expert. The proof is public by default.",
    },
    app: {
      connectTitle: "Connect your wallet to start",
      connectSubtitle: "You'll sign transactions with Freighter.",
      issuerLabel: "Issuer",
      issuerDesc: "Issue & manage",
      employerLabel: "Employer",
      employerDesc: "Inspect & pay",
      issuerRegisterTitle: "Register a certificate",
      issuerRegisterSubtitle:
        "Upload the PDF or paste a 64-char hex hash. You'll sign as the issuer.",
      issuerDoneTitle: "Certificate registered",
      issuerDoneSubtitle: "Trusted verification is done. Employers can now inspect the proof and pay the graduate.",
      verifyTitle: "Verify the credential",
      verifySubtitle: "Look it up first, then use an approved issuer or admin wallet to verify, suspend, or revoke it.",
      employerWaitTitle: "Wait for trusted verification",
      employerWaitSubtitle: "Employers can inspect the credential here, but payment only unlocks after an approved issuer or admin verifies it.",
      payTitle: "Pay the verified graduate",
      paySubtitle: "Send the payment amount linked to this certificate.",
      doneTitle: "All done",
      doneSubtitle: "The verified badge is ready to share.",
      roleHintIssuer:
        "You're an educator or institution that issues and verifies certificates.",
      roleHintEmployer:
        "You're a company that wants to verify a graduate's credential and pay them.",
    },
  },
  tl: {
    hero: {
      eyebrow: "Stellar Testnet / Soroban / Freighter",
      h1a: "I-verify ang credentials.",
      h1b: "I-settle ang bayad sa iisang flow.",
      lede: "I-anchor ang certificate hash sa Stellar. Kapag verified na ng approved issuer o admin, puwedeng i-check ng employer at magbayad agad, walang email thread, walang invoice delay, walang platform fee.",
      ctaPrimary: "Subukan ang app →",
      ctaGhost: "Subukan ang 2-min demo, walang wallet →",
      personas: [
        {
          label: "Issue",
          title: "Para sa bootcamps at issuers",
          body: "I-register ang certificate hash, i-verify gamit ang approved wallet, at panatilihing audit-ready ang proof.",
          cta: "Mag-issue",
        },
        {
          label: "Verify",
          title: "Para sa recruiters at reviewers",
          body: "I-paste ang hash, tingnan ang public proof page, at i-download ang recruiter-safe summary.",
          cta: "Mag-verify",
        },
        {
          label: "Hire",
          title: "Para sa employers",
          body: "I-review ang verified graduate at mag-fund ng paid trial na naka-link sa credential record.",
          cta: "Mag-fund ng trial",
        },
      ],
    },
    footer: {
      tagline:
        "On-chain credential registry sa Stellar testnet. Ginawa para sa Stellar PH Bootcamp 2026.",
    },
    about: {
      lede: "One idea lang: certificates should be verifiable in seconds, hindi sa pamamagitan ng email. Tapos mabayaran agad.",
      problemKicker:
        "Real ang certificate niya. Pero proving it? Mas mahal pa kaysa mag-hire ng iba.",
      approachKicker:
        "Hindi lang na-verify ang credential, na-pay na rin si Maria. Sa iisang session. Yun ang punto.",
    },
    app: {
      connectTitle: "I-connect ang wallet mo para magsimula",
      connectSubtitle: "Mag-sign ng transactions gamit ang Freighter.",
      issuerLabel: "Issuer",
      issuerDesc: "Mag-issue at manage",
      employerLabel: "Employer",
      employerDesc: "Tingnan at bayaran",
      issuerRegisterTitle: "Mag-register ng certificate",
      issuerRegisterSubtitle:
        "I-upload ang PDF o i-paste ang 64-char hex hash. Ikaw ang mag-sign bilang issuer.",
      issuerDoneTitle: "Certificate registered na",
      issuerDoneSubtitle: "Tapos na ang trusted verification. Puwede nang i-check ng employer ang proof at bayaran ang graduate.",
      verifyTitle: "I-verify ang credential",
      verifySubtitle: "Hanapin muna, tapos gumamit ng approved issuer o admin wallet para mag-verify, suspend, o revoke.",
      employerWaitTitle: "Maghintay ng trusted verification",
      employerWaitSubtitle: "Puwedeng tingnan ng employer ang credential dito, pero payment lang kapag na-verify na ito ng approved issuer o admin.",
      payTitle: "Bayaran ang verified graduate",
      paySubtitle:
        "I-send ang payment amount na naka-link sa certificate na ito.",
      doneTitle: "Tapos na",
      doneSubtitle: "Handa na ang verified badge para i-share.",
      roleHintIssuer:
        "Ikaw ay educator o institution na nag-iissue at nag-ve-verify ng certificates.",
      roleHintEmployer:
        "Ikaw ay company na gustong i-verify ang credential ng graduate at bayaran sila.",
    },
  },
  es: {
    hero: {
      eyebrow: "Stellar Testnet / Soroban / Freighter",
      h1a: "Verifica credenciales.",
      h1b: "Liquida el pago en un solo flujo.",
      lede: "Stellaroid Earn ancla los hashes de los certificados en Stellar para que las empresas puedan revisar el registro y pagarle al graduado sin salir del flujo, una vez que un emisor aprobado o un administrador lo verifica. Sin cadenas de correos, sin demoras de facturación, sin comisiones de plataforma.",
      ctaPrimary: "Prueba la app →",
      ctaGhost: "Mira la demo de 2 min, no necesitas billetera →",
      personas: [
        {
          label: "Emitir",
          title: "Para bootcamps y emisores",
          body: "Registra el hash de un certificado, verifícalo con una billetera aprobada y mantén la prueba lista para auditoría.",
          cta: "Empezar a emitir",
        },
        {
          label: "Verificar",
          title: "Para reclutadores y revisores",
          body: "Pega un hash, revisa la página de prueba pública y descarga un resumen apto para reclutadores.",
          cta: "Buscar una prueba",
        },
        {
          label: "Contratar",
          title: "Para empresas",
          body: "Revisa a un graduado verificado y financia un trabajo de prueba remunerado vinculado al registro de la credencial.",
          cta: "Financiar un trabajo de prueba",
        },
      ],
    },
    footer: {
      tagline:
        "Registro de credenciales on-chain en la testnet de Stellar. Creado para el Stellar PH Bootcamp.",
    },
    about: {
      lede: "Un software mínimo alrededor de una sola idea: los certificados deberían poder verificarse en segundos, no por correo. Y si son verificables, el graduado debería cobrar con el mismo toque.",
      problemKicker:
        "El certificado es real. El problema es que demostrarlo cuesta más que contratar como si no existiera.",
      approachKicker:
        "El resultado canónico no es la interfaz, sino el flujo de eventos en stellar.expert. La prueba es pública por defecto.",
    },
    app: {
      connectTitle: "Conecta tu billetera para empezar",
      connectSubtitle: "Firmarás las transacciones con Freighter.",
      issuerLabel: "Emisor",
      issuerDesc: "Emitir y gestionar",
      employerLabel: "Empresa",
      employerDesc: "Revisar y pagar",
      issuerRegisterTitle: "Registra un certificado",
      issuerRegisterSubtitle:
        "Sube el PDF o pega un hash hexadecimal de 64 caracteres. Firmarás como emisor.",
      issuerDoneTitle: "Certificado registrado",
      issuerDoneSubtitle:
        "La verificación de confianza está lista. Ahora las empresas pueden revisar la prueba y pagarle al estudiante.",
      verifyTitle: "Verifica la credencial",
      verifySubtitle:
        "Búscala primero y luego usa una billetera de emisor aprobado o de administrador para verificarla, suspenderla o revocarla.",
      employerWaitTitle: "Espera la verificación de confianza",
      employerWaitSubtitle:
        "Las empresas pueden revisar la credencial aquí, pero el pago solo se habilita después de que un emisor aprobado o un administrador la verifique.",
      payTitle: "Paga al estudiante verificado",
      paySubtitle: "Envía el monto del pago vinculado a este certificado.",
      doneTitle: "Listo",
      doneSubtitle: "La insignia verificada está lista para compartir.",
      roleHintIssuer:
        "Eres un educador o una institución que emite y verifica certificados.",
      roleHintEmployer:
        "Eres una empresa que quiere verificar la credencial de un graduado y pagarle.",
    },
  },
  pt: {
    hero: {
      eyebrow: "Stellar Testnet / Soroban / Freighter",
      h1a: "Verifique credenciais.",
      h1b: "Liquide o pagamento em um só fluxo.",
      lede: "A Stellaroid Earn ancora os hashes dos certificados na Stellar para que as empresas possam revisar o registro e pagar o graduado sem sair do fluxo, assim que um emissor aprovado ou um administrador verificar a credencial. Sem trocas de e-mail, sem espera por fatura, sem taxas de plataforma.",
      ctaPrimary: "Experimente o app →",
      ctaGhost: "Veja a demo de 2 min, não precisa de carteira →",
      personas: [
        {
          label: "Emitir",
          title: "Para bootcamps e emissores",
          body: "Registre o hash de um certificado, verifique-o com uma carteira aprovada e mantenha o comprovante pronto para auditoria.",
          cta: "Começar a emitir",
        },
        {
          label: "Verificar",
          title: "Para recrutadores e avaliadores",
          body: "Cole um hash, veja a página pública do comprovante e baixe um resumo apropriado para recrutadores.",
          cta: "Buscar um comprovante",
        },
        {
          label: "Contratar",
          title: "Para empresas",
          body: "Avalie um graduado verificado e financie um trabalho de teste remunerado vinculado ao registro da credencial.",
          cta: "Financiar um trabalho de teste remunerado",
        },
      ],
    },
    footer: {
      tagline:
        "Registro de credenciais on-chain na testnet da Stellar. Criado para o Stellar PH Bootcamp.",
    },
    about: {
      lede: "Um software enxuto em torno de uma única ideia: certificados deveriam ser verificáveis em segundos, não por e-mail. E se são verificáveis, o graduado deveria receber no mesmo toque.",
      problemKicker:
        "O certificado é real. O problema é que comprová-lo custa mais do que contratar como se ele não existisse.",
      approachKicker:
        "O resultado canônico não é a interface, e sim o fluxo de eventos no stellar.expert. O comprovante é público por padrão.",
    },
    app: {
      connectTitle: "Conecte sua carteira para começar",
      connectSubtitle: "Você vai assinar as transações com a Freighter.",
      issuerLabel: "Emissor",
      issuerDesc: "Emitir e gerenciar",
      employerLabel: "Empresa",
      employerDesc: "Revisar e pagar",
      issuerRegisterTitle: "Registre um certificado",
      issuerRegisterSubtitle:
        "Envie o PDF ou cole um hash hexadecimal de 64 caracteres. Você vai assinar como emissor.",
      issuerDoneTitle: "Certificado registrado",
      issuerDoneSubtitle:
        "A verificação confiável está concluída. Agora as empresas podem revisar o comprovante e pagar o estudante.",
      verifyTitle: "Verifique a credencial",
      verifySubtitle:
        "Busque primeiro e depois use uma carteira de emissor aprovado ou de administrador para verificá-la, suspendê-la ou revogá-la.",
      employerWaitTitle: "Aguarde a verificação confiável",
      employerWaitSubtitle:
        "As empresas podem revisar a credencial aqui, mas o pagamento só é liberado depois que um emissor aprovado ou um administrador verificar a credencial.",
      payTitle: "Pague o estudante verificado",
      paySubtitle: "Envie o valor do pagamento vinculado a este certificado.",
      doneTitle: "Tudo pronto",
      doneSubtitle: "O selo verificado está pronto para compartilhar.",
      roleHintIssuer:
        "Você é um educador ou uma instituição que emite e verifica certificados.",
      roleHintEmployer:
        "Você é uma empresa que quer verificar a credencial de um graduado e pagá-lo.",
    },
  },
  id: {
    hero: {
      eyebrow: "Stellar Testnet / Soroban / Freighter",
      h1a: "Verifikasi kredensial.",
      h1b: "Selesaikan pembayaran dalam satu alur.",
      lede: "Stellaroid Earn menambatkan hash sertifikat di Stellar sehingga perusahaan dapat memeriksa catatannya dan membayar lulusan tanpa keluar dari alur kerja begitu penerbit yang disetujui atau admin memverifikasinya. Tanpa utas email, tanpa penundaan faktur, tanpa biaya platform.",
      ctaPrimary: "Coba aplikasinya →",
      ctaGhost: "Ikuti demo 2 menit, tanpa wallet →",
      personas: [
        {
          label: "Terbitkan",
          title: "Untuk bootcamp dan penerbit",
          body: "Daftarkan hash sertifikat, verifikasi dengan wallet yang disetujui, dan jaga buktinya tetap siap diaudit.",
          cta: "Mulai menerbitkan",
        },
        {
          label: "Verifikasi",
          title: "Untuk perekrut dan peninjau",
          body: "Tempel hash, periksa halaman bukti publik, dan unduh ringkasan yang aman untuk perekrut.",
          cta: "Cari bukti",
        },
        {
          label: "Rekrut",
          title: "Untuk perusahaan",
          body: "Tinjau lulusan terverifikasi dan danai uji coba berbayar yang terkait dengan catatan kredensial.",
          cta: "Danai uji coba",
        },
      ],
    },
    footer: {
      tagline:
        "Registri kredensial on-chain di Stellar testnet. Dibuat untuk Stellar PH Bootcamp.",
    },
    about: {
      lede: "Perangkat lunak ringan dengan satu ide inti: sertifikat seharusnya bisa diverifikasi dalam hitungan detik, bukan email. Dan jika bisa diverifikasi, lulusan seharusnya dibayar dengan ketukan yang sama.",
      problemKicker:
        "Sertifikatnya asli. Masalahnya, membuktikannya lebih mahal daripada merekrut dengan cara lain.",
      approachKicker:
        "Keluaran kanoniknya bukanlah UI; melainkan aliran event di stellar.expert. Buktinya bersifat publik secara bawaan.",
    },
    app: {
      connectTitle: "Hubungkan wallet Anda untuk memulai",
      connectSubtitle: "Anda akan menandatangani transaksi dengan Freighter.",
      issuerLabel: "Penerbit",
      issuerDesc: "Terbitkan & kelola",
      employerLabel: "Perusahaan",
      employerDesc: "Periksa & bayar",
      issuerRegisterTitle: "Daftarkan sertifikat",
      issuerRegisterSubtitle:
        "Unggah PDF atau tempel hash heksadesimal 64 karakter. Anda akan menandatangani sebagai penerbit.",
      issuerDoneTitle: "Sertifikat terdaftar",
      issuerDoneSubtitle:
        "Verifikasi tepercaya selesai. Perusahaan kini dapat memeriksa bukti dan membayar mahasiswa.",
      verifyTitle: "Verifikasi kredensial",
      verifySubtitle:
        "Cari dulu, lalu gunakan wallet penerbit yang disetujui atau wallet admin untuk memverifikasi, menangguhkan, atau mencabutnya.",
      employerWaitTitle: "Tunggu verifikasi tepercaya",
      employerWaitSubtitle:
        "Perusahaan dapat memeriksa kredensial di sini, tetapi pembayaran hanya terbuka setelah penerbit yang disetujui atau admin memverifikasinya.",
      payTitle: "Bayar mahasiswa terverifikasi",
      paySubtitle: "Kirim jumlah pembayaran yang terkait dengan sertifikat ini.",
      doneTitle: "Semua selesai",
      doneSubtitle: "Lencana terverifikasi siap dibagikan.",
      roleHintIssuer:
        "Anda adalah pendidik atau institusi yang menerbitkan dan memverifikasi sertifikat.",
      roleHintEmployer:
        "Anda adalah perusahaan yang ingin memverifikasi kredensial lulusan dan membayarnya.",
    },
  },
  vi: {
    hero: {
      eyebrow: "Stellar Testnet / Soroban / Freighter",
      h1a: "Xác minh chứng chỉ.",
      h1b: "Thanh toán trong cùng một luồng.",
      lede: "Stellaroid Earn neo hash của chứng chỉ lên Stellar để nhà tuyển dụng có thể kiểm tra hồ sơ và thanh toán cho học viên mà không cần rời khỏi quy trình, ngay khi một tổ chức cấp phát được phê duyệt hoặc quản trị viên xác minh nó. Không có chuỗi email, không có chậm trễ hóa đơn, không có phí nền tảng.",
      ctaPrimary: "Dùng thử ứng dụng →",
      ctaGhost: "Xem demo 2 phút, không cần ví →",
      personas: [
        {
          label: "Cấp phát",
          title: "Dành cho bootcamp và tổ chức cấp phát",
          body: "Đăng ký hash của chứng chỉ, xác minh bằng ví được phê duyệt, và giữ bằng chứng luôn sẵn sàng cho việc kiểm toán.",
          cta: "Bắt đầu cấp phát",
        },
        {
          label: "Xác minh",
          title: "Dành cho chuyên viên tuyển dụng và người thẩm định",
          body: "Dán một hash, kiểm tra trang bằng chứng công khai, và tải về bản tóm tắt an toàn cho chuyên viên tuyển dụng.",
          cta: "Tra cứu bằng chứng",
        },
        {
          label: "Tuyển dụng",
          title: "Dành cho nhà tuyển dụng",
          body: "Xem lại một học viên đã được xác minh và cấp vốn cho một đợt làm thử có trả phí gắn với hồ sơ chứng chỉ.",
          cta: "Cấp vốn làm thử",
        },
      ],
    },
    footer: {
      tagline:
        "Sổ đăng ký chứng chỉ on-chain trên Stellar testnet. Được xây dựng cho Stellar PH Bootcamp.",
    },
    about: {
      lede: "Một phần mềm gọn nhẹ xoay quanh một ý tưởng: chứng chỉ nên có thể được xác minh trong vài giây, chứ không phải qua email. Và nếu đã xác minh được, học viên nên được thanh toán ngay trong cùng một thao tác.",
      problemKicker:
        "Chứng chỉ là thật. Vấn đề là chi phí chứng minh nó còn cao hơn cả việc tuyển dụng theo cách khác để né nó.",
      approachKicker:
        "Đầu ra chuẩn tắc không phải là giao diện; đó là luồng sự kiện trên stellar.expert. Bằng chứng mặc định là công khai.",
    },
    app: {
      connectTitle: "Kết nối ví của bạn để bắt đầu",
      connectSubtitle: "Bạn sẽ ký các giao dịch bằng Freighter.",
      issuerLabel: "Tổ chức cấp phát",
      issuerDesc: "Cấp phát và quản lý",
      employerLabel: "Nhà tuyển dụng",
      employerDesc: "Kiểm tra và thanh toán",
      issuerRegisterTitle: "Đăng ký một chứng chỉ",
      issuerRegisterSubtitle:
        "Tải lên tệp PDF hoặc dán một hash hex 64 ký tự. Bạn sẽ ký với tư cách tổ chức cấp phát.",
      issuerDoneTitle: "Đã đăng ký chứng chỉ",
      issuerDoneSubtitle:
        "Việc xác minh tin cậy đã hoàn tất. Nhà tuyển dụng giờ có thể kiểm tra bằng chứng và thanh toán cho học viên.",
      verifyTitle: "Xác minh chứng chỉ",
      verifySubtitle:
        "Tra cứu trước, sau đó dùng ví của tổ chức cấp phát được phê duyệt hoặc ví quản trị viên để xác minh, tạm ngưng, hoặc thu hồi nó.",
      employerWaitTitle: "Chờ xác minh tin cậy",
      employerWaitSubtitle:
        "Nhà tuyển dụng có thể kiểm tra chứng chỉ tại đây, nhưng việc thanh toán chỉ mở khóa sau khi một tổ chức cấp phát được phê duyệt hoặc quản trị viên xác minh chứng chỉ.",
      payTitle: "Thanh toán cho học viên đã xác minh",
      paySubtitle: "Gửi số tiền thanh toán gắn với chứng chỉ này.",
      doneTitle: "Hoàn tất",
      doneSubtitle: "Huy hiệu đã xác minh đã sẵn sàng để chia sẻ.",
      roleHintIssuer:
        "Bạn là một nhà giáo dục hoặc tổ chức cấp phát và xác minh chứng chỉ.",
      roleHintEmployer:
        "Bạn là một công ty muốn xác minh chứng chỉ của học viên và thanh toán cho họ.",
    },
  },
};
