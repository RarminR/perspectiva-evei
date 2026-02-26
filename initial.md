BRIEF DEV — Platforma Perspectiva Evei (v1)
0) Scop
Construirea unei platforme proprii care:
înlocuiește Memberstack + Vimeo + Make


centralizează Curs ADO (ediții + lecții), Ghiduri (reader securizat) + audiobook, Ședințe 1:1


securizează conținutul (anti-share)


maximizează revenue prin upsell/cross-sell/bundles/promos


folosește Revolut Payment Gateway pentru checkout (taxe mai bune)


integrează direct prin API unde e cazul (ex: SmartBill pentru facturi)



1) Module produse
1.1 Cursul ADO (cohort-based)
Situație curentă: Memberstack pentru access plan, Stripe pentru plată, Vimeo embed pentru video.
Probleme:
video embed poate fi extras (link de embed) și distribuit


nu există control pe device/IP


accesul se taie complet după 1 lună fără opțiune de prelungire plătită


link-urile / lecțiile nu sunt centralizate într-un parcurs coerent


toți cumpărătorii trebuie să ajungă obligatoriu la ședință 1:1 cu Eva, dar flow-ul e greoi


Cerinte v1:
Structură curs


Curs ADO → Ediția X → Lecții


Lecțiile trebuie să suporte tipuri diferite:


Video (înregistrare curs)


Live Zoom (link + “complete” după participare / confirmare)


Material post-curs (text / fișier / link intern)


Snippet din ghid (teaser + CTA spre cumpărare ghid)


Step de upsell (CTA către alt ghid / bundle / 1:1)


Player video securizat


Nu se livrează embed public.


Video trebuie să fie accesibil doar dacă userul e autentificat + are entitlement valid.


Minim: link-uri semnate / tokenizate cu expirare și verificare server-side.


(V2) măsuri extra anti-piracy.


Device/IP locking (Netflix-like)


limită: ex. max 2 device-uri active per cont (configurabil)


device list în cont + opțiune “logout other devices”


opțional IP lock (configurabil; recomandat “soft”, ca să nu blocheze mobil/roaming)


Acces + prelungire


acces standard: 30 zile (configurabil)


produs separat: “Prelungire acces curs” (ex: +30 / +90 zile)


la cumpărare → extinde access_end_at


Streamline către 1:1


după achiziția cursului, userul trebuie direcționat în platformă către:


modul de programare 1:1 (sau contact form dacă nu e încă setat calendarul)


CTA persistent în dashboard: “Programează ședința 1:1 (obligatoriu)”



1.2 Ghiduri + Audiobook
Situație curentă: one-time pay, acces prin download PDF.
Probleme:
PDF-ul poate fi distribuit/pirat/copiat conținutul


experiență de citire necontrolată și fără upsell contextual


audiobook urmează să fie introdus


Cerințe v1:
Reader intern (fără download)


ghidul se citește în platformă, capitole/pagini


progres (resume reading)


dezactivare select/copy (nu perfect, dar ridică bariera)


watermark dinamic (email/user id) peste conținut


entitlement-based access


Audiobook integrat


player audio în pagina ghidului


resume, capitole (minim), control viteză (opțional v1)


Cross-sell / upsell în reader


în interiorul ghidului: CTA către:


Curs ADO


1:1


alte ghiduri


la final: recomandări + upsell bundle


Bundles + promo sales


bundle-uri (ex: 2–3 ghiduri cu discount)


coduri promo (procent / sumă fixă / perioadă)



1.3 Ședințe 1:1
Situație curentă: formular + mult back-and-forth.
Cerințe v1 (MVP recomandat):
Eva definește disponibilități (sloturi / ore de lucru + excluderi)


clienta alege slot → confirmare


opțional: “needs approval” (Eva acceptă/respinge)


notificări email + calendar invite (ICS / integrare Google Calendar dacă se dorește)



2) Checkout & plăți — Revolut Payment Gateway (obligatoriu)
Cerință: recomandare + implementare checkout pe Revolut.
Produse care trebuie vândute prin Revolut
acces Curs ADO (ediția X)


prelungire acces curs


ghiduri (one-time)


bundles (one-time)


(opțional) ședințe 1:1 plătite, dacă există modelul (nu ai menționat explicit, îl lăsăm configurabil)


Webhooks / flow de confirmare
la plată confirmată:


creare Order


creare/activare Entitlement pe produs


email de confirmare


(opțional) trigger SmartBill invoice


la refund / chargeback:


dezactivează entitlement sau pune pe hold


Dev-ul să verifice capabilitățile Revolut Checkout (webhooks, payment status, refunds) și să propună implementarea corectă pe stack-ul ales.

3) Facturare — SmartBill (prin API)
Cerință: factură automată după plată confirmată.
mapare order → invoice_id


acces user la facturi din cont (download link / pdf)



4) Eliminări & motivație (explicit în brief)
Scoatem din mix:
Memberstack → auth + entitlements făcute intern


Vimeo → video delivery securizat intern (nu embed public)


Make → automatizări implementate ca job-uri interne + webhooks (plăți, acces, facturi, email)


Obiectiv: reducere subscriptions + control + securitate + scalare revenue pe ghiduri.

5) Roluri & ecrane (MVP)
Roluri
Admin (Eva/echipă)


User (clientă)


Ecrane user
Sign up / login


Dashboard (“Produsele mele”)


Pagina Curs ADO (ediția X) + lista lecții + progres


Player video securizat


Reader ghid + audiobook


Checkout Revolut (hosted sau embedded, în funcție de implementare)


Programare 1:1


Cont: device management (max 2), facturi, ordine


Ecrane admin
CRUD: cursuri / ediții / lecții (tipuri multiple)


CRUD: ghiduri / capitole / audio


Orders & entitlements (manual override)


Program 1:1 (availability)


Promo codes / bundles



6) Model de date (minim, pentru estimare)
users


products (course_edition, guide, bundle, extend_access)


orders (revolut_payment_id, amount, status)


entitlements (user_id, product_id, start_at, end_at, status)


course_editions, lessons (type, order, resources, unlock rules)


guides, guide_chapters, audiobook_tracks


device_sessions (user_id, device_fingerprint, last_seen, active)


appointments, availability_slots



7) Cerințe non-funcționale
securitate: tokenized delivery + entitlement checks


anti-share: device limit + watermark reader


audit: log pentru login/devices


scalabilitate: conținutul să fie modular (ediții, lecții, ghiduri ușor de administrat)



8) Deliverables cerute de la dev (ca să-ți facă “propunerea”)
Dev-ul trebuie să livreze:
Arhitectură propusă (stack + hosting + storage media)


Estimare pe faze (MVP / V2), timeline în săptămâni + cost


Listă integrări:


Revolut checkout + webhooks


SmartBill API


Email provider (Sendgrid/Mailgun etc.)


Plan de migrare (useri existenți, conținut existent, cumpărături existente)


Risk list (device locking, anti-piracy, delivery media)

As vrea sa adaug ca as vrea sa fie in NextJs cu Postgresql. 