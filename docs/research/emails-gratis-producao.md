# Enviar emails transacionais em produção sem domínio próprio (opções gratuitas)

> **Âmbito:** investigação (2026-11-16) sobre opções **gratuitas** para enviar emails
> transacionais/aplicacionais de uma app em produção quando o utilizador **não tem
> domínio próprio** — apenas uma conta Gmail pessoal.
> Todas as afirmações foram verificadas contra fontes primárias (docs oficiais), com
> URL citado em cada secção. Não contém código de implementação.

---

## 1. Gmail SMTP pessoal (smtp.gmail.com + App Password)

### 1.1. É possível? Sim — e oficialmente documentado

A Google documenta o uso do `smtp.gmail.com` (porta 465 SSL / 587 TLS) com
autenticação por credenciais da conta para enviar a partir de apps e dispositivos
(fonte: *Send email from a printer, scanner, or app*, Google Workspace Admin Help —
https://support.google.com/a/answer/176600 — a página aplica-se a contas Workspace;
para contas pessoais o servidor é o mesmo).

O Nodemailer (docs oficiais) confirma os dois métodos de autenticação em vigor:

| Método | Estado |
|---|---|
| OAuth 2.0 | Recomendado para novas integrações |
| App Password (16 caracteres) | Funciona **apenas com 2-Step Verification ativa** |
| "Less Secure Apps" (password normal) | **Desativado permanentemente em 30 de maio de 2022** |

Fonte: https://nodemailer.com/guides/using-gmail ("Google permanently disabled
'Less Secure App' access on May 30, 2022").

### 1.2. Regras das App Passwords

- **Requer 2FA**: "To create an app password, you need 2-Step Verification on your
  Google Account." A opção nem aparece sem 2FA ativa.
- Não é possível criar App Password se o 2FA estiver configurado apenas com chaves
  de segurança, se a conta for gerida por uma organização, ou com **Advanced
  Protection** ativado.
- As App Passwords são **revogadas** quando se muda a password da conta Google.
- Fonte: *Sign in with app passwords*, Google Account Help —
  https://support.google.com/accounts/answer/185833

### 1.3. Limites oficiais de envio (contas pessoais)

- **500 destinatários/dia** para contas Gmail pessoais: "you may see this message if
  you send an email to a total of more than 500 recipients in a single email and or
  more than 500 emails sent in a day."
- Ao atingir o limite, o envio é suspenso **1 a 24 horas**.
- Também há bloqueio por bounces ("Messages you sent couldn't be delivered" quando
  muitos emails batem ou são inválidos — novamente 24h de espera).
- Fonte: *Limits for sending & getting mail*, Gmail Help —
  https://support.google.com/mail/answer/22839
- Contas **Google Workspace** têm 2.000/dia via `smtp.gmail.com`
  (https://support.google.com/a/answer/176600) — mas Workspace exige domínio próprio
  e subscrição paga.

### 1.4. Riscos e limitações para produção

- **Não é concebido para serviços automatizados.** Docs do Nodemailer: "Gmail is
  designed for individual users, not automated services, and Google's security
  systems actively monitor for suspicious login activity… it will block the SMTP
  connection without delivering the message." Google pode bloquear o IP do servidor
  de produção (ex.: servidor num país diferente do habitual).
  Fonte: https://nodemailer.com/guides/using-gmail
- **O `From:` é reescrito**: "Gmail always overwrites the sender address with the
  authenticated account's email address." Só se pode enviar como a própria conta ou
  alias configurado. Fonte: https://nodemailer.com/guides/using-gmail
- **ToS/abuse**: a política de spam e abuso do Gmail
  (https://support.google.com/a/answer/178266, integrada na Acceptable Use Policy
  do Workspace) proíbe envio não solicitado; as *Email sender guidelines*
  (https://support.google.com/a/answer/81126) exigem SPF/DKIM alinhado com o
  `From:` e proíbem "impersonate Gmail From: headers". Uma app a enviar como
  `@gmail.com` não é proibida em texto explícito quando usa a própria conta, mas
  fica fora de qualquer garantia de entrega e o volume é irrisório face a qualquer
  serviço transacional.
- **Atingir o limite diário bloqueia também o uso pessoal** da caixa de correio
  durante 1–24h — má ideia quando o Gmail é a conta principal do utilizador.

### 1.5. SMTP relay do Workspace requer domínio?

- Sim. O **SMTP relay** (`smtp-relay.gmail.com`) é um serviço do **Google
  Workspace** (pago) e está configurado para os domínios da organização; não existe
  para contas Gmail gratuitas. Fonte:
  https://support.google.com/a/answer/176600 e
  https://support.google.com/a/answer/5567604
- O servidor restrito (`aspmx.l.google.com`, porta 25) **só entrega a
  utilizadores Gmail/Workspace** — inútil para uma app com utilizadores externos.
  Fonte: https://support.google.com/a/answer/176600

---

## 2. Serviços transacionais com free tier — verificação um a um

### Tabela comparativa

| Serviço | Free tier (2025/26) | Exige domínio próprio? | Aceita `@gmail.com` como sender? | Fonte |
|---|---|---|---|---|
| **Resend** | 3.000/mês, **100/dia** | **Sim** para enviar a outros (só `resend.dev` → para o próprio email) | Não (uso do `onboarding@resend.dev` é só para o email da conta) | https://resend.com/pricing · https://resend.com/docs/knowledge-base/403-error-resend-dev-domain |
| **Brevo** | **300/dia** (sem rollover; +1.000 em fila de retry p/ transacionais) | Não (sender único verificado por email), mas **reescreve** senders gratuitos | Sim para verificar; **mas** substitui `x@gmail.com` → `x@5000001.t-sender-sib.com` | https://help.brevo.com/hc/en-us/articles/208580669 · https://help.brevo.com/hc/en-us/articles/14925263522578 |
| **Mailgun** | Sem plano free real; sandbox **só Authorized Recipients** (máx. 5) | **Sim** para produção ("for your regular, production-level sending… you will need to acquire a domain") | Não | https://help.mailgun.com/hc/en-us/articles/217531258 · https://help.mailgun.com/hc/en-us/articles/202464990 |
| **Mailjet** | 6.000/mês, **200/dia**, sem cartão | Não — basta verificar **endereço de email** (domínio opcional) | Sim, **sem reescrita** — mas as próprias docs avisam spam/entrega falhada com freemail | https://www.mailjet.com/pricing/ · https://documentation.mailjet.com/hc/en-us/articles/360042759253 |
| **SendGrid** | **Eliminado**: trial de **60 dias**, 100/dia; após isso, plano pago ($19.95+) | Sender único verificado não exige domínio; autenticação de domínio exigida antes de upgrade | Sim (com aviso de DMARC) | https://support.sendgrid.com/hc/en-us/articles/35270136965403 · https://www.twilio.com/en-us/changelog/changes-coming-to-sendgrid-s-free-plans |
| **MailerSend** | 500/mês, 100/dia (após aprovação + cartão) | **Sim** — `From` tem de pertencer ao domínio verificado; trial domain é só para testes | Não (Sender Identities só em planos pagos) | https://www.mailersend.com/help/plans-features-and-limits · https://www.mailersend.com/help/how-to-start-sending-emails |
| **SMTP2GO** | 1.000/mês, **200/dia** | Sender domain recomendado; **single sender email** permitido — **mas o registo não aceita endereços de domínios gratuitos** | Não (signup exige email de domínio próprio/empresarial) | https://support.smtp2go.com/hc/en-gb/articles/223087947 · https://support.smtp2go.com/hc/en-gb/articles/115004408567 · https://support.smtp2go.com/hc/en-gb/articles/12747932085145 |
| **Amazon SES** | Até **$200 em créditos** Free Tier (plano free 6 meses; créditos até 12 meses) | Não para verificar **endereço**; sim para DKIM/DNS de domínio (recomendado) | Sim — verificação de endereço de email é permitida (mas DMARC de terceiros não alinha) | https://aws.amazon.com/ses/pricing/ · https://docs.aws.amazon.com/ses/latest/dg/verify-email-addresses.html |
| **Zoho CPaaS (ZeptoMail/Transact)** | **1 crédito grátis = 10.000 emails** (válido 6 meses; 100/dia até validação) | **Sim** — exige "a company email on your own website domain" | Não | https://www.zoho.com/cpaas/ (pré-validação por terceiro: https://startupperks.co/programs/zoho-cpaas-email-free-credit) |
| **Plunk** | 1.000/mês, sem cartão | Envio usa **domínios personalizados** com DKIM/SPF/DMARC automáticos | Não previsto | https://useplunk.com/pricing |

> **Nota (secções 5–8):** esta tabela cobre serviços que **entregam a terceiros**.
> Para testar em volume ("martelar") sem entregar a ninguém — sem Gmail, sem
> domínio, sem limites — ver as secções 5–7 (servidores de captura local e
> sandboxes cloud) e a recomendação de desenvolvimento na secção 8.

### Notas serviço a serviço

#### Resend
- Free: 3.000 emails/mês e **limite de 100/dia**; 3 domínios.
  Fonte: https://resend.com/pricing
- **Sem domínio verificado, o domínio partilhado `onboarding@resend.dev` só
  entrega ao endereço de email da própria conta Resend.** Enviar a terceiros
  devolve `403`: "You can only send testing emails to your own email address…
  To send emails to other recipients, please verify a domain at resend.com."
  Fonte: https://resend.com/docs/knowledge-base/403-error-resend-dev-domain
- Logo, **não serve para produção real** sem domínio.

#### Brevo
- Free para sempre, sem cartão: **300 envios/dia**, reset diário, sem rollover;
  para transacionais, até 1.000 extras ficam em fila de retry.
  Fonte: https://help.brevo.com/hc/en-us/articles/208580669
- O email de registo é automaticamente verificado como sender — **aceita
  @gmail.com** (adicionar/verificar novos senders é igualmente por email).
  Fontes: https://www.brevo.com/free-smtp-server/ e artigo "Create a new sender"
  do help center.
- **Risco relevante (2026)**: para cumprir os requisitos Gmail/Yahoo/Microsoft,
  a Brevo **substitui o sender gratuito** — transacionais de
  `mycompany@gmail.com` passam a ser entregues como
  `mycompany@5000001.t-sender-sib.com`. Isto vale mesmo para volume baixo:
  "Brevo replaces any free email address used for sending, regardless of the
  recipients."
  Fonte: https://help.brevo.com/hc/en-us/articles/14925263522578
- **Onboarding (validado para produção)**: free para sempre, **sem cartão**
  ("The Free plan is completely free forever. No credit card required, no time
  limit." — https://help.brevo.com/hc/en-us/articles/208589409). Não é preciso
  verificar domínio, **mas é preciso esperar pela aprovação da conta**:
  "Once we approve your account for sending, you can start sending up to 300
  emails per day." (FAQ do pricing — https://www.brevo.com/pricing/).
- **Deliverability sem domínio**: por defeito os emails saem assinados com o
  DKIM do domínio partilhado da Brevo, não do vosso: "If you did not
  authenticate your domain signature, your recipients might see Brevo's domain
  signature instead of yours"
  (https://help.brevo.com/hc/en-us/articles/209429285). A reescrita do From
  existe precisamente "to maintain basic deliverability"
  (https://help.brevo.com/hc/en-us/articles/14925263522578) — ou seja, **os
  emails continuam a entregar** a terceiros; o custo é o From visível.
- **Logo da Brevo**: no plano free o rodapé leva sempre o logo: "If you have a
  free plan, the logo will always be displayed in your footer"
  (https://help.brevo.com/hc/en-us/articles/209429285).
- **Reply-To**: as docs não documentam se o endereço original é preservado em
  `Reply-To`; o que está documentado é que o `From` visível passa a ser o
  substituto ("Recipients may not recognize the replaced address"
  — https://help.brevo.com/hc/en-us/articles/14925263522578). Confirmar com um
  email real antes de depender disso.
- **Veredito**: ✅ **APTO** para produção real <300/dia sem domínio e sem Gmail —
  única via 100 % gratuita que entrega a terceiros com DKIM da Brevo — com as
  ressalvas: From reescrito, logo no rodapé, 300/dia, aprovação de conta
  inicial (detalhes na secção 9).

#### Mailgun
- Sandbox `sandbox<hash>@mailgun.org` só envia para **Authorized Recipients**
  (máx. 5, após aceitarem convite). Sem cartão de crédito, a restrição mantém-se.
  Fontes: https://documentation.mailgun.com/docs/mailgun/user-manual/domains/domains-sandbox ·
  https://help.mailgun.com/hc/en-us/articles/217531258
- "Do I have to use a domain to send email? Yes… for your regular,
  production-level sending through Mailgun, you will need to acquire a domain."
  Fonte: https://help.mailgun.com/hc/en-us/articles/202464990
- **Não serve** para produção sem domínio.

#### Mailjet
- Free plan real e permanente: **200 emails/dia, 6.000/mês, sem cartão** —
  "Our services start with a Free Plan that offers you 200 emails a day:
  that's 6,000 a month!" (https://documentation.mailjet.com/hc/en-us/articles/1260803978230)
  e FAQ do pricing: "No, there is no credit card required for the free plan at
  sign up" (https://www.mailjet.com/pricing/). Exceder os 200/dia põe os emails
  em fila até 3 dias, entregues a 200/24h
  (https://documentation.mailjet.com/hc/en-us/articles/1260803978230).
- **Sender**: basta validar um **endereço de email** por link de confirmação —
  domínio é opcional e existe só como atalho para muitos senders: "You can add
  many sending addresses from different domains… You also have the option of
  adding and validating an entire domain" (https://documentation.mailjet.com/hc/en-us/articles/360042759253).
  Aceita endereços @gmail.com **sem reescrita** (não há mecanismo equivalente ao
  da Brevo documentado).
- **Aviso oficial sobre freemail**: "When using Mailjet to send emails from
  free email services like Gmail, Yahoo, Outlook, or AOL, you may encounter
  obstacles. The likelihood of your email ending up in the spam or junk folder
  increases… In some cases, the email may not be delivered at all."
  (https://documentation.mailjet.com/hc/en-us/articles/360042759253) — ou seja,
  a Mailjet deixa o From gmail como está, assume SPF/DKIM alinhado apenas
  quando se configura SPF/DKIM de **domínio próprio**
  (https://dev.mailjet.com/docs/email-api/senders-domains/spf-dkim-validation.md)
  e avisa do risco; não é o modelo "entrega na mesma" da Brevo.
- **Onboarding**: sem cartão, mas contas novas entram em **Test Mode** com
  limite de **10 emails/hora** até a conta ser verificada: "To move out of Test
  Mode and lift the 10 emails per hour limit, simply respond to the email you
  received… it can only be lifted once your account information is verified."
  (https://documentation.mailjet.com/hc/en-us/articles/360042624754). Contas
  free limitadas a 1.000 contactos (https://documentation.mailjet.com/hc/en-us/articles/1260803978230).
- **Veredito**: ⚠️ **APTO COM RESSALVAS** — free real sem cartão e sem domínio,
  mas From @gmail.com fica sem DKIM alinhado (risco de spam conforme as docs da
  própria Mailjet) e há um limiar inicial de 10/h até à verificação da conta.
  Para transacionais fidedignos, a Brevo é melhor; detalhes na secção 9.

#### SendGrid
- **O plano free permanente foi retirado**: contas novas a partir de
  25/03/2025 recebem um **trial de 60 dias** com 100 emails/dia; ao fim de 60
  dias o envio para, a menos que se passe a plano pago (Essentials $19.95/mo).
  Fontes: https://support.sendgrid.com/hc/en-us/articles/35270136965403 ·
  https://www.twilio.com/en-us/changelog/changes-coming-to-sendgrid-s-free-plans
- **Single Sender Verification** é possível por email (inclui endereços de
  grandes provedores, com aviso: "Messages from this domain might fail a DMARC
  check"). Fonte:
  https://www.twilio.com/docs/sendgrid/ui/sending-email/sender-verification
- Mesmo aceitando gmail como sender, **a janela de 60 dias** mata qualquer
  projeto de produção a custo zero.

#### MailerSend
- Free: 500 emails/mês, 100/dia, **sujeito a aprovação da conta** e introdução
  de dados de faturação/cartão. Fonte:
  https://www.mailersend.com/help/plans-features-and-limits e
  https://www.mailersend.com/pricing
- **O `From` tem de pertencer a um domínio verificado**: "any email has to be
  sent with a FROM address matching the verified domain". O *trial domain* é
  exclusivamente para testes. Fonte:
  https://www.mailersend.com/help/how-to-start-sending-emails
- **Não serve** sem domínio próprio (Sender Identities que permitiriam
  `@gmail.com` só existem nos planos Starter+ pagos).

#### SMTP2GO
- Free: 1.000/mês, **200/dia**, sem cartão; sem domínio verificado há limite
  adicional de 25/hora. Fonte:
  https://support.smtp2go.com/hc/en-gb/articles/223087947-Free-Plan
- **Barreira dupla para quem só tem Gmail**:
  1. O próprio registo exige email não gratuito: "You will need to use a work
     email address or an address at a domain of your own (you cannot use
     addresses at shared domains such as Gmail.com, Outlook.com, Yahoo.com
     etc.)" — https://support.smtp2go.com/hc/en-gb/articles/12747932085145
  2. Single sender emails não podem ser de domínios com DMARC restritivo
     (https://support.smtp2go.com/hc/en-gb/articles/115004408567) e emails com
     single sender aparecem "via smtpcorp.com" no Gmail.
- **Não é utilizável** por alguém que só tem Gmail.

#### Amazon SES
- **Free Tier mudou**: "New AWS customers will receive up to $200 in AWS Free
  Tier credits… The free plan will be available for 6 months after account
  creation… All Free Tier credits must be used within 12 months."
  Fonte: https://aws.amazon.com/ses/pricing/ (o clássico "3.000 emails/mês
  grátis" foi substituído por créditos).
- **Pode verificar um endereço de email individual** (incl. @gmail.com) como
  identidade de envio, sem domínio:
  https://docs.aws.amazon.com/ses/latest/dg/verify-email-addresses.html
- Mas toda a conta começa em **sandbox**: só envia para endereços também
  verificados, máx. 200/dia, 1 msg/seg; **request production access** (revisão
  humana, ~24h) é obrigatório antes de produção — e na revisão a AWS pede um
  URL de website e descrição do caso de uso.
  Fontes: https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html ·
  https://docs.aws.amazon.com/ses/latest/dg/verify-email-addresses.html
- Veredicto: tecnicamente possível, mas envolve conta AWS, sandbox, revisão — e
  com sender `@gmail.com` tem os mesmos problemas de DMARC da secção 3.

#### Zoho CPaaS (ex-ZeptoMail / Transact)
- **1 crédito grátis de 10.000 emails** (válido 6 meses, só transacionais),
  com teto de 100/dia até a Zoho validar a conta.
  Fonte: https://www.zoho.com/cpaas/ (validação independente a 2026-10-22:
  https://startupperks.co/programs/zoho-cpaas-email-free-credit)
- **Exige domínio próprio**: "A company email on your own website domain (not a
  personal address)". Fonte: idem.
- **Não serve** sem domínio.

#### Plunk
- Free: 1.000/mês, sem cartão; envio através de **domínios personalizados** com
  DKIM/SPF/DMARC configurados automaticamente.
  Fonte: https://useplunk.com/pricing
- Tal como a maioria, o fluxo de envio pressupõe domínio verificado; sem
  domínio não há caminho de produção documentado.

---

## 3. Deliverability de enviar "From: @gmail.com" via serviço terceiro

Este é o problema transversal a todos os serviços que aceitam um sender
`@gmail.com` (Brevo, SendGrid single sender, SES email identity):

1. **SPF não autoriza o serviço.** O SPF de `gmail.com` autoriza apenas os
   servidores do Google. Um email enviado pela Brevo/SES com `From:
   x@gmail.com` falha SPF para o domínio do `From:`. As guidelines do Google
   dizem-no: "If your third-party senders aren't included in your SPF record,
   messages from these senders are more likely to be marked as spam."
   Fonte: https://support.google.com/a/answer/81126

2. **DMARC não alinha.** Para passar DMARC o domínio autenticante (SPF ou
   DKIM) tem de ser o do `From:`: "The authenticating domain must be the same
   domain that appears in the message From: header."
   Fonte: https://support.google.com/a/answer/81126

3. **A própria Google desaconselha `From: @gmail.com` de terceiros.**
   "Don't impersonate Gmail From: headers. Gmail will begin using a DMARC
   quarantine enforcement policy, and impersonating Gmail From: headers might
   impact your email delivery." — ou seja, o Gmail está a endurecer a política
   para emails que se fazem passar por Gmail sem passar pelo Google.
   Fonte: https://support.google.com/a/answer/81126

4. **Os provedores removem/sinalizam o endereço.**
   - Brevo **reescreve** o sender para um endereço del próprio
     (`x@5000001.t-sender-sib.com`) — https://help.brevo.com/hc/en-us/articles/14925263522578
   - SendGrid avisa que "Messages from this domain might fail a DMARC check" ao
     verificar senders de grandes provedores —
     https://www.twilio.com/docs/sendgrid/ui/sending-email/sender-verification
   - SMTP2GO: emails com single sender aparecem "via smtpcorp.com" no Gmail —
     https://support.smtp2go.com/hc/en-gb/articles/115004408567

5. **Consequência prática**: emails legítimos podem cair em spam ou ser
   rejeitados (erro 5.7.26 no Gmail quando falha autenticação:
   https://support.google.com/a/answer/3726730). Para uma app real de
   produção (recuperação de password, notificações), isso é um risco inaceitável.

---

## 4. Discussão: caminhos possíveis para produção com volume baixo (<200/dia)

### Opção 1 — Gmail SMTP com App Password
- **Custo**: 0 €. Setup: minutos (2FA + App Password + Nodemailer).
- **Pró**: única solução verdadeiramente 0 € **sem domínio**, com autenticação
  completa (o `From` é o próprio Gmail, logo SPF/DKIM/DMARC passam e os emails
  são assinados pelo Google — deliverability na inbox é geralmente boa).
- **Contras**:
  - limite 500/dia e bloqueio de 1–24h ao exceder
    (https://support.google.com/mail/answer/22839);
  - risco de bloqueio do IP do servidor (https://nodemailer.com/guides/using-gmail);
  - `From` sempre reescrito para a conta (sem branding);
  - emails transacionais misturados com a caixa pessoal; não há logs, webhooks
    nem métricas de entrega;
  - violar repetidamente os limites pode levar a restrições da conta pessoal.
- Veredicto: **aceitável para um projeto pequeno/familiar** com destinatários
  conhecidos e volume real <100/dia, com fallback se falhar. **Não recomendado**
  para produto público com utilizadores externos.

### Opção 2 — Serviço free tier sem domínio
- **Não existe atualmente.** Resend (`resend.dev`) só entrega ao próprio email;
  Mailgun sandbox só a 5 Authorized Recipients; MailerSend exige domínio
  verificado; SMTP2GO nem registo aceita com Gmail; Zoho exige domínio;
  SendGrid só dá 60 dias.
- A **única** exceção parcial é a **Brevo (300/dia)** que aceita sender Gmail —
  mas **reescreve-o** para `x@5000001.t-sender-sib.com`
  (https://help.brevo.com/hc/en-us/articles/14925263522578), o que degrada a
  identidade e a confiança dos destinatários.
- Veredicto: **parcialmente viável** (revisado na secção 9): a Brevo (300/dia)
  é a exceção que sobrevive ao rastreio para produção sem domínio; o resto
  desta família (Mailgun, MailerSend, Zoho, SMTP2GO, SendGrid) não serve.

### Opção 3 — Comprar domínio barato + Resend free tier
- **Custo**: ~10–15 €/ano (domínio `.com`/`.pt` no registrador à escolha); o
  email em si fica **grátis para sempre** (Resend: 3.000/mês, 100/dia, 3
  domínios, sem cartão). Fonte: https://resend.com/pricing
- **Pró**:
  - DKIM/SPF/DMARC do próprio domínio → deliverability real e escalável;
  - `From` com branding (`noreply@naf-sua-app.com`);
  - logs, webhooks, supressão automática de bounces (https://resend.com/pricing);
  - caminho de crescimento claro (Pro $20/mo se crescer).
  - Alternativa equivalente no mesmo modelo: Plunk (1.000/mês grátis,
    https://useplunk.com/pricing) ou SMTP2GO (1.000/mês, 200/dia,
    https://support.smtp2go.com/hc/en-gb/articles/223087947-Free-Plan) — ambos
    exigem igualmente o domínio.
- **Contras**: exige compra do domínio e tocar em DNS uma vez (DKIM/SPF — o
  Resend dá os registos e a verificação demora tipicamente minutos/horas,
  https://resend.com/docs/dashboard/domains/introduction).

### Resumo dos trade-offs

| | Custo | Fiabilidade em produção | Branding/From | Esforço |
|---|---|---|---|---|
| 1. Gmail SMTP + App Password | 0 € | Média/baixa (bloqueios possíveis, sem SLA, logs) | Nenhum (`@gmail.com`) | Baixo |
| 2. Free tier sem domínio (Brevo) | 0 € | Média (sender reescrito) | Degradado (`t-sender-sib.com`) | Baixo |
| 3. Domínio barato + Resend/Plunk/SMTP2GO | ~10–15 €/ano | **Alta** | Completo | Médio (DNS uma vez) |

---

## 5. Servidores SMTP de captura local — "martelar" sem limites (Categoria A)

Servidores SMTP **falsos de desenvolvimento**: aceitam qualquer email que a app
envie, guardam-no numa UI local e **nunca entregam a ninguém real**. Não há
limites, deliverability, spam nem banimento — porque nada sai da máquina.
Servem para desenvolvimento/staging; **em produção não entregam emails reais**.

### Mailpit (github.com/axllent/mailpit) — a escolha recomendada

- **Ativo e mantido em 2026**: ~10.900 estrelas, ~2.160 commits, CI ativo
  (testes, builds e Docker automáticos). Licença **MIT**.
  Fonte: https://github.com/axllent/mailpit
- **Como funciona**: atua como servidor SMTP (porta por omissão **1025**) e
  Web UI (porta **8025**) para ver os emails capturados; tem ainda uma
  **REST API** para testes de integração automatizados:
  "It acts as an SMTP server, provides a modern web interface to view & test
  captured emails, and includes an API for automated integration testing."
  Fontes: https://github.com/axllent/mailpit ·
  https://mailpit.axllent.org/docs/ · https://mailpit.axllent.org/docs/api-v1/
- **Docker oficial**: imagens multi-arquitectura `axllent/mailpit`
  (https://hub.docker.com/r/axllent/mailpit, docs:
  https://mailpit.axllent.org/docs/install/docker/).
- **Limites**: nenhum limite de envio documentado. Performance declarada:
  "ingesting 200-300 emails per second over SMTP… easily handling tens of
  thousands of emails, with automatic email pruning by volume or message age
  (by default keeping the most recent 500 emails)" — ou seja, martelar é
  literalmente ilimitado; a única limitação é a retenção (configurável).
  Fonte: https://github.com/axllent/mailpit
- Extras úteis: verificação de HTML, link check, **spam check** via
  SpamAssassin/Rspamd, modo **Chaos** (simula erros SMTP), webhooks, POP3,
  relaying opcional (desligado por omissão — não entrega nada sem configurar).
  Fonte: https://github.com/axllent/mailpit

### MailHog (github.com/mailhog/MailHog) — descontinuado

- **Abandonado**: última release v1.0.0 (2017), copyright 2014–2017, sem
  atividade. Fonte: https://github.com/mailhog/MailHog
- O próprio Mailpit declara que MailHog "is **no longer maintained** and hasn't
  seen active development or security updates for a few years now"
  (https://github.com/axllent/mailpit, com link para
  https://github.com/mailhog/MailHog/issues/442).
- **Recomendação: não usar**; usar Mailpit como sucessor direto.

### smtp4dev e MailDev — menção breve

- **smtp4dev** (https://github.com/rnwood/smtp4dev): ativo (~4.000 estrelas,
  ~1.860 commits), .NET mas servidor SMTP genérico, BSD-3-Clause, Docker,
  TUI, IMAP/POP3, simulação de erros.
- **MailDev** (https://github.com/maildev/maildev): ativo — v3.0 é uma
  reescrita completa em TypeScript (6.200 estrelas, MIT); SMTP na porta 1025,
  Web UI na 1080, `--max-emails` por omissão **ilimitado**, MCP para agentes
  IA. Fonte: https://github.com/maildev/maildev
- Ambos válidos; Mailpit tem a comunidade mais ativa e API mais usada.

---

## 6. Sandboxes cloud de captura (Categoria B)

### Ethereal (ethereal.email) — o serviço de teste do Nodemailer

- "It's a completely **free** anti-transactional email service where messages
  **never get delivered**." Credenciais instantâneas sem signup nem
  verificação: "Call `nodemailer.createTestAccount()` … you get SMTP
  credentials instantly, no signup or email verification required."
- Envia-se para "any recipient address, real or made up. Every message is
  caught; nothing is ever delivered." Preview via
  `nodemailer.getTestMessageUrl(info)`; mensagens visíveis
  "caught in the last 15 days"; também IMAP/POP3.
- Fonte: https://ethereal.email/ (rodapé "© 2017–2026" — serviço ativo)
- Limites declarados: a página inicial **não publica** limite diário/mensal;
  a retenção documentada é de 15 dias. Fonte: https://ethereal.email/faq

### Mailtrap.io — free tier real, mas pequeno

- Mailtrap tem **dois produtos** com free plans distintos
  (https://mailtrap.io/pricing/):
  - **Email Sandbox** (captura, testing): Free = **50 emails de teste/mês**,
    1 sandbox, 10 emails retidos, 1 email/10 s. Fonte:
    https://mailtrap.io/pricing/ e
    https://docs.mailtrap.io/email-sandbox/help/features-and-limits.md
  - **Email Live Sending** (entrega real): Free = 4.000/mês, **150/dia**,
    1 domínio de envio. Fonte: https://mailtrap.io/pricing/
- Para martelar volume, o Sandbox free (50/mês) é pequeno; o Mailtrap é
  melhor para staging com análise de HTML/spam. Nota: o Mailtrap patrocina o
  Mailpit ("our friendly companion" — https://github.com/axllent/mailpit).

---

## 7. Outras caixas de email pessoal (Categoria C) — alternativas ao Gmail

### Outlook.com / Hotmail pessoal

- **Limites**: "Sending limits in Outlook.com"
  (https://support.microsoft.com/en-us/outlook/sending-limits-in-outlook-com):
  assinantes Microsoft 365 = 5.000 destinatários/dia, 500/msg, 1.000
  "non-relationship" recipients/dia; **contas gratuitas têm limites mais
  baixos e dinâmicos** ("Limits may vary based on usage history and will be
  lower for non-subscribers") e contas novas começam com quota temporária
  baixa. O valor clássico "300/dia" para contas free aparece no suporte da
  Microsoft (https://learn.microsoft.com/en-us/answers/questions/96319b4e-382a-4a0a-879a-48af46bbe50f),
  mas a página oficial não o fixa.
- **App passwords já não funcionam para email**: a Microsoft desativou o
  Basic Auth nas contas pessoais a 16/09/2024 — "Starting September 16th,
  2024, Microsoft will no longer support Basic Auth"
  (https://techcommunity.microsoft.com/blog/outlook/keeping-our-outlook-personal-email-users-safe-reinforcing-our-commitment-to-secu/4164184).
  O SMTP (`smtp-mail.outlook.com:587`) exige **OAuth2/Modern Auth**:
  "Outlook.com requires the use of Modern Auth / OAuth2"
  (https://support.microsoft.com/en-us/outlook/pop-imap-and-smtp-settings-for-outlook-com).
  A tentativa com password/app password devolve
  "5.7.139 Authentication unsuccessful, basic authentication is disabled"
  (https://learn.microsoft.com/en-us/answers/questions/5891288/request-to-enable-smtp-authentication-for-clientca).
- Veredicto: para uma app, exige OAuth implementado; e mesmo assim os limites
  dinâmicos dos contas free são mais baixos que os do Gmail.

### Zoho Mail (free tier)

- Free plan: 5 utilizadores, 5 GB, 1 domínio; **IMAP/POP/ActiveSync não
  incluídos** e disponível "only in select data centres"
  (https://www.zoho.com/mail/zohomail-pricing.html).
- SMTP (`smtp.zoho.com`) está listado para contas free, com limites
  **dinâmicos por reputação**: "Outgoing emails (External): 50-500
  emails/hour"; 100 destinatários/msg (free); ao exceder, o envio fica
  suspenso até 1 hora
  (https://www.zoho.com/mail/help/adminconsole/rates-and-limits.html,
  atualizado 2026-11-02). A política de uso proíbe bulk/promocional/automático.
- Veredicto: mesmo modelo de problemas do Gmail — limites horários dinâmicos
  e risco de bloqueio por atividade automatizada.

### Conclusão honesta (Categoria C)

Qualquer caixa de email pessoal (Gmail, Outlook, Zoho) tem limites
diários/horários dinâmicos na ordem dos ~100–500/dia, controlo anti-spam
agressivo e risco de bloqueio da conta pessoal. **"Martelar" com envio real
nunca é grátis nem seguro** — por isso a Categoria C só faz sentido como
fallback de baixo volume (ver secção 1 do relatório).

---

## 8. Como "martelar" sem partido (recomendação de desenvolvimento)

A regra fundamental: **martelar = servidor de captura; entregar a emails reais
= os limites do relatório principal aplicam-se.** Não existe martelar "para
fora": qualquer SMTP real (Gmail, Brevo, Mailjet…) tem quota, reputation e
ToS. O que existe é martelar contra um servidor que captura.

### Setup concreto recomendado (desenvolvimento)

1. **Mailpit em Docker** como SMTP da app:
   ```
   docker run -p 1025:1025 -p 8025:8025 axllent/mailpit
   ```
   A app aponta para um SMTP configurável por variável de ambiente, ex.:
   `SMTP_URL=smtp://localhost:1025` (sem autenticação). Web UI em
   `http://localhost:8025`. Fonte: https://github.com/axllent/mailpit e
   https://mailpit.axllent.org/docs/install/docker/
2. **Testes de integração/CI**: usar a REST API do Mailpit
   (https://mailpit.axllent.org/docs/api-v1/) para verificar mensagens
   recebidas e o modo **Chaos** para simular falhas de SMTP
   (https://mailpit.axllent.org/docs/integration/chaos/).
3. **Sem Docker** (ou para casos rápidos): **Ethereal**
   (https://ethereal.email/) — credenciais de teste instantâneas, captura
   cloud, preview URL; nada é entregue.
4. Alternativas equivalentes: **MailDev** (`docker run -p 1080:1080 -p
   1025:1025 maildev/maildev` — https://github.com/maildev/maildev) e
   **smtp4dev** (https://github.com/rnwood/smtp4dev). **MailHog** está
   abandonado (secção 5).
5. Em staging com análise de HTML/spam: **Mailtrap Sandbox** — mas o free é
   só 50 emails/mês (secção 6).
6. Padrão prático: manter o host/porta SMTP sempre por variável de ambiente.
   Em dev `SMTP_URL=smtp://localhost:1025`; em produção aponta para o serviço
   real (Resend/Brevo/…) — a app não muda, muda a variável.

---

## 9. Produção real sem domínio: o que sobrevive ao rastreio

Pergunta: **entregar a emails reais de terceiros, a custo zero, sem domínio
customizado e sem a conta Gmail pessoal.** Validado serviço a serviço
(2026-11-16); SES e domínios grátis marcados como validação parcial.

### (a) Opções que sobrevivem ao rastreio

| Opção | Limite free | Exigências | From visto pelo recipient | Risco principal | Veredito |
|---|---|---|---|---|---|
| **Brevo** (transacional) | **300/dia**, free para sempre, sem cartão | Aprovação da conta antes de enviar (FAQ pricing); sem domínio | `x@<id>.t-sender-sib.com` (reescrito) + logo Brevo no rodapé | From não reconhecível → pode gerar spam reports ("Recipients may not recognize the replaced address" — https://help.brevo.com/hc/en-us/articles/14925263522578) | ✅ **APTO** |
| **Mailjet** | **200/dia**, 6.000/mês, sem cartão | Sair do Test Mode (10/h) com verificação da conta (https://documentation.mailjet.com/hc/en-us/articles/360042624754); sem domínio | `x@gmail.com` **sem reescrita** | Docs da própria Mailjet: freemail From → spam ou não entrega (https://documentation.mailjet.com/hc/en-us/articles/360042759253) | ⚠️ **APTO c/ ressalvas** |
| **Amazon SES** | Até **$200 em créditos** Free Tier (free plan 6 meses) — https://aws.amazon.com/ses/pricing/ | Conta AWS + **request production access**: mail type, **Website URL**, declaração de opt-in e tratamento de bounces (https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html) | `x@gmail.com` (identidade de email verificada, sem DKIM próprio — DKIM/Easy DKIM só existe para identidades de domínio, https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html) | Mesmo problema DMARC/spam do From @gmail.com + fricção da revisão (até 96 h) | ⏳ validação parcial — viável tecnicamente, a concluir |
| **Domínio grátis** (eu.org, pp.ua) | Domínio 0 € | eu.org: aprovação manual lenta (relatos de semanas a meses; fila acumulada em 2025 — https://forum.infinityfree.com/t/how-to-get-a-free-eu-org-domain/88508); pp.ua: continua grátis mas exige telemóvel para ativação e **cartão ligado à conta** nic.ua (https://nic.ua/en/knowledge-base/free-pp-ua-domain-order-not-executed, https://nic.ua/en/domains/.pp.ua) | From autenticado no domínio gratuito (DKIM/SPF próprios) | TLD/subdomínio pouco comum pode ter reputação fraca; risco de dependência de serviço voluntário | ⏳ validação pendente |

### (b) Resposta directa — o que usar HOJE a custo zero, por preferência

1. **Brevo** — o único free tier 100 % permanente (sem cartão, sem prazo) que
   **entrega a terceiros** sem domínio: os emails saem assinados com o DKIM
   da Brevo e o From é reescrito para o domínio partilhado transacional
   precisamente "to maintain basic deliverability"
   (https://help.brevo.com/hc/en-us/articles/14925263522578). Ideal para
   notificações de uma app de administração com <300/dia, aceitando o From
   `…@t-sender-sib.com` e o logo no rodapé.
2. **Mailjet** — alternativa honesta (200/dia, 6.000/mês, sem cartão,
   sender @gmail.com aceite), mas com From gmail sem autenticação alinhada,
   o que as docs da própria Mailjet avisam como risco de spam/entrega falhada
   (https://documentation.mailjet.com/hc/en-us/articles/360042759253). Usar
   só se o From gmail for aceitável ou se a verificação de conta passar
   depressa.
3. **(A concluir) Amazon SES** — o sandbox não impede pedir **production
   access sem domínio** (a verificação de domínio é só "a best practice that
   helps to get your production access request approved faster"
   — https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html);
   o pedido exige Website URL e compromisso de opt-in/bounces, e o From
   @gmail.com fica com o mesmo problema de DMARC. Validação a completar.
4. **(A concluir) Domínio grátis + Resend/Brevo** — única via com From
   totalmente autenticado a 0 €, dependendo da aprovação (eu.org) ou do
   registo com telemóvel+cartão (pp.ua). Validação a completar.
5. Fallback conhecido: **Gmail SMTP com App Password** (secção 1) — mantém
   DKIM/SPF/DMARC do Gmail por defeito, mas usa a conta pessoal e tem
   500/dia com bloqueio de 1–24 h
   (https://support.google.com/mail/answer/22839).

### (c) Notas de validação parcial (SES e domínios grátis)

- **SES**: production access **não exige domínio** — basta ter identidades de
  email verificadas; o wizard aceita o pedido com mail type + Website URL +
  contactos + declaração (opt-in explícito e processo de bounce/complaint)
  (https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html).
  Preço a produzir: $0.10/1.000 (à la carte) ou $0.16/1.000 no plano
  Essentials de contas novas (https://aws.amazon.com/ses/pricing/). Faltam
  confirmar: taxa de aprovação para quem só tem um site em domínio alheio e
  o comportamento real de deliverability com From @gmail.com.
- **Domínios grátis**: eu.org ainda existe mas a aprovação está muito atrasada
  (relatos 2025–2026 de pedidos com 18+ meses pendentes e afirmações de que
  "no longer receive new domain register"
  — https://forum.infinityfree.com/t/how-to-get-a-free-eu-org-domain/88508);
  pp.ua está vivo e é grátis para sempre, mas o registo exige ativação por
  SMS/Telegram e a ligação de um cartão de pagamento à conta nic.ua
  (https://nic.ua/en/knowledge-base/free-pp-ua-domain-order-not-executed,
  https://nic.ua/en/knowledge-base/pp-ua-domains-restrictions). Com qualquer
  um deles + Resend/Brevo, o From fica autenticado; risco: reputação e
  blocklists de TLDs pouco comuns — a validar na fase seguinte.

---

## Recomendação

Para um **projecto em produção real** com volume baixo (<200 emails/dia):

1. **Caminho recomendado: comprar um domínio barato (~10 €/ano) e usar o free
   tier do Resend** (100/dia, 3.000/mês, sem cartão), verificando o domínio
   (DKIM/SPF/DMARC). É a única opção a custo quase zero que tem deliverability
   séria, `From` com marca, logs e webhooks, e não corre risco de bloqueio por
   políticas de terceiros. Plunk (1.000/mês) e SMTP2GO (1.000/mês, 200/dia) são
   alternativas equivalentes sobre o mesmo domínio.
2. **Se o custo tem de ser estritamente 0 € (nem domínio)**: usar **Gmail SMTP
   com App Password** (2FA obrigatória), sabendo e aceitando os limites (500
   destinatários/dia com pausa de 1–24h, risco de bloqueio do IP do servidor,
   `From` reescrito). É a solução mais fiável a custo zero absoluto porque a
   autenticação DKIM/SPF/DMARC do Gmail passa por defecto; mas não construir
   nada crítico por cima dela. Usar OAuth 2.0 (em vez de App Password) se o
   projeto for durar mais, conforme recomendado pelo Nodemailer.
3. **Evitar**: Mailgun/MailerSend/Zoho/SMTP2GO sem domínio (bloqueados por
   design) e SendGrid como "free tier" (é um trial de 60 dias desde março de
   2025). O sender `@gmail.com` verificado em serviços terceiros só é
   aceitável onde o serviço assume a entrega (Brevo reescreve) — nunca onde
   o From fica exposto sem autenticação alinhada (Mailjet/SES).
4. **Produção a custo zero SEM domínio e SEM Gmail**: **Brevo transacional**
   (300/dia, entrega com DKIM da Brevo, From reescrito + logo) — veredicto
   ✅ na secção 9; **Mailjet** (200/dia) como alternativa com ressalvas.
5. **Desenvolvimento / "martelar" sem limites**: ver secções 5 e 8 —
   **Mailpit em Docker** (`docker run -p 1025:1025 -p 8025:8025
   axllent/mailpit`) como SMTP de captura da app, ou **Ethereal** sem Docker;
   ambos a 0 €, ilimitados e nunca entregam a ninguém real. O Gmail/Brevo/
   Mailjet só entram quando há de **entregar** emails verdadeiros.

---

## Índice de fontes primárias

- Gmail — limites de envio: https://support.google.com/mail/answer/22839
- Google — App passwords: https://support.google.com/accounts/answer/185833
- Google — Email sender guidelines: https://support.google.com/a/answer/81126
- Google — SMTP relay / envio de apps (Workspace):
  https://support.google.com/a/answer/176600
- Google — Spam and abuse policy in Gmail: https://support.google.com/a/answer/178266
- Nodemailer — Using Gmail: https://nodemailer.com/guides/using-gmail
- Nodemailer — OAuth2: https://nodemailer.com/smtp/oauth2
- Resend — Pricing: https://resend.com/pricing
- Resend — 403 error resend.dev:
  https://resend.com/docs/knowledge-base/403-error-resend-dev-domain
- Resend — Verified domains: https://resend.com/docs/dashboard/domains/introduction
- Brevo — Limits of the Free plan:
  https://help.brevo.com/hc/en-us/articles/208580669
- Brevo — Gmail/Yahoo/Microsoft sender requirements:
  https://help.brevo.com/hc/en-us/articles/14925263522578
- Mailgun — Sandbox domains:
  https://documentation.mailgun.com/docs/mailgun/user-manual/domains/domains-sandbox
- Mailgun — Authorized Recipients:
  https://help.mailgun.com/hc/en-us/articles/217531258
- Mailgun — How can I start sending email:
  https://help.mailgun.com/hc/en-us/articles/202464990
- SendGrid — 60-Day Free Trial plans:
  https://support.sendgrid.com/hc/en-us/articles/35270136965403
- Twilio — Changes to SendGrid free plans:
  https://www.twilio.com/en-us/changelog/changes-coming-to-sendgrid-s-free-plans
- SendGrid — Single sender verification:
  https://www.twilio.com/docs/sendgrid/ui/sending-email/sender-verification
- MailerSend — Plans, features and limits:
  https://www.mailersend.com/help/plans-features-and-limits
- MailerSend — How to start sending emails:
  https://www.mailersend.com/help/how-to-start-sending-emails
- SMTP2GO — Free Plan: https://support.smtp2go.com/hc/en-gb/articles/223087947-Free-Plan
- SMTP2GO — Verified Senders:
  https://support.smtp2go.com/hc/en-gb/articles/115004408567
- SMTP2GO — Quick Start Guide:
  https://support.smtp2go.com/hc/en-gb/articles/12747932085145
- AWS — SES pricing / Free Tier: https://aws.amazon.com/ses/pricing/
- AWS — SES verify email addresses:
  https://docs.aws.amazon.com/ses/latest/dg/verify-email-addresses.html
- AWS — SES request production access:
  https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html
- Zoho CPaaS (ZeptoMail): https://www.zoho.com/cpaas/
- Plunk — Pricing: https://useplunk.com/pricing

**Secções 5–8 (martelar / testes em volume):**

- Mailpit — README: https://github.com/axllent/mailpit
- Mailpit — docs (SMTP, Docker, API, Chaos):
  https://mailpit.axllent.org/docs/ · https://mailpit.axllent.org/docs/api-v1/ ·
  https://mailpit.axllent.org/docs/install/docker/ ·
  https://mailpit.axllent.org/docs/integration/chaos/
- MailHog — README (abandonado): https://github.com/mailhog/MailHog
- MailHog — issue #442 (fim da manutenção):
  https://github.com/mailhog/MailHog/issues/442
- smtp4dev — README: https://github.com/rnwood/smtp4dev
- MailDev — README (v3): https://github.com/maildev/maildev
- Ethereal: https://ethereal.email/
- Mailtrap — Pricing: https://mailtrap.io/pricing/
- Mailtrap — Sandbox limits:
  https://docs.mailtrap.io/email-sandbox/help/features-and-limits.md
- Microsoft — Sending limits in Outlook.com:
  https://support.microsoft.com/en-us/outlook/sending-limits-in-outlook-com
- Microsoft — POP, IMAP e SMTP settings (Outlook.com, OAuth2):
  https://support.microsoft.com/en-us/outlook/pop-imap-and-smtp-settings-for-outlook-com
- Microsoft — Fim do Basic Auth (Outlook pessoal, 16/09/2024):
  https://techcommunity.microsoft.com/blog/outlook/keeping-our-outlook-personal-email-users-safe-reinforcing-our-commitment-to-secu/4164184
- Microsoft Q&A — erro 5.7.139 no SMTP pessoal:
  https://learn.microsoft.com/en-us/answers/questions/5891288/request-to-enable-smtp-authentication-for-clientca
- Zoho Mail — Rates, limits and policies:
  https://www.zoho.com/mail/help/adminconsole/rates-and-limits.html
- Zoho Mail — Pricing: https://www.zoho.com/mail/zohomail-pricing.html

**Secção 9 (produção real sem domínio):**

- Brevo — Limits of the Free plan:
  https://help.brevo.com/hc/en-us/articles/208580669
- Brevo — About Brevo's pricing plans (free forever, sem cartão):
  https://help.brevo.com/hc/en-us/articles/208589409
- Brevo — Gmail/Yahoo/Microsoft requirements + reescrita do From:
  https://help.brevo.com/hc/en-us/articles/14925263522578
- Brevo — Will my contacts know that I'm using Brevo? (logo free + DKIM):
  https://help.brevo.com/hc/en-us/articles/209429285
- Brevo — Pricing (FAQ: aprovação da conta antes de enviar):
  https://www.brevo.com/pricing/
- Brevo Community — reescrita t-sender-sib.com (resposta do staff):
  https://community.brevo.com/t/email-being-sent-with-t-sender-sib-com/783
- Mailjet — Pricing (FAQ free plan, sem cartão): https://www.mailjet.com/pricing/
- Mailjet — How It Works (200/dia, 6.000/mês, fila de 3 dias):
  https://documentation.mailjet.com/hc/en-us/articles/1260803978230
- Mailjet — How to add a sender address (aviso freemail):
  https://documentation.mailjet.com/hc/en-us/articles/360042759253
- Mailjet — Blocked or Limited Account (Test Mode 10/h):
  https://documentation.mailjet.com/hc/en-us/articles/360042624754
- Mailjet — SPF/DKIM validation guide:
  https://dev.mailjet.com/docs/email-api/senders-domains/spf-dkim-validation.md
- AWS — Request production access (SES):
  https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html
- AWS — Creating and verifying identities (SES):
  https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html
- AWS — SES pricing / Free Tier: https://aws.amazon.com/ses/pricing/
- eu.org (estado da aprovação, discussão 2025–26):
  https://forum.infinityfree.com/t/how-to-get-a-free-eu-org-domain/88508 ·
  https://nic.eu.org/
- pp.ua / NIC.UA — domínio grátis, ativação por SMS e cartão:
  https://nic.ua/en/domains/.pp.ua ·
  https://nic.ua/en/knowledge-base/free-pp-ua-domain-order-not-executed ·
  https://nic.ua/en/knowledge-base/pp-ua-domains-restrictions

*Investigação conduzida em 2026-11-16. Os free tiers mudam com frequência —
rever as páginas de preços antes de decidir.*
