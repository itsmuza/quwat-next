# Quwat frontend

Next.js 14 Pages Router, React 18, MUI/SCSS va Apollo Client saqlangan. Katalog, profil, Saved, agent davomat va admin boshqaruvi Quwat backend kontraktiga moslashtirilgan.

## Ishga tushirish

Frontend buyruqlari uchun yarn ishlatiladi:

```bash
yarn install
yarn dev
```

Lokal backend `http://localhost:3007/graphql`, frontend odatda `http://localhost:3000` manzilida ishlaydi. Mavjud env nomlari saqlangan:

```dotenv
REACT_APP_API_URL=http://localhost:3007
REACT_APP_API_GRAPHQL_URL=http://localhost:3007/graphql
REACT_APP_API_WS=ws://localhost:3007
```

Frontendga faqat ommaviy endpointlar beriladi. Token browser storage'da saqlanadi; rol va profil JWT'dan emas, backendning joriy Member javobidan olinadi.

## Tekshiruvlar

```bash
yarn typecheck
yarn lint
yarn test:migration
yarn check:graphql
yarn build
git diff --check
```

`check:graphql` backenddan faqat sxemani o‘qiydi va frontenddagi operatsiyalarni tekshiradi; mutation bajarmaydi. Backend o‘chiq bo‘lsa, oldindan olingan SDL bilan ishlaydi:

```bash
yarn check:graphql --schema /absolute/path/schema.graphql
```

Oraliq bosqichda alohida modullarni tekshirish uchun `--files apollo/user/product.ts,apollo/admin/product.ts` ishlatiladi. `test:migration` Node'ning mavjud test runneri bilan mock auth, URL/input validatsiyasi va sana qoidalarini tekshiradi; database talab qilmaydi.

## Sahifalar va rollar

- `/product`, `/product/detail?id=<productId>` — ommaviy ACTIVE katalog.
- `/agent`, `/agent/detail?agentId=<memberId>`, `/member?memberId=<memberId>` — profillar va social funksiyalar.
- `/mypage` — profil, yoqtirilganlar va yaqinda ko‘rilganlar.
- `/mypage?category=saved` — faqat CLIENT; ARCHIVED mahsulotlar havolasiz qoladi.
- `/mypage?category=attendance` — faqat AGENT; Toshkent sanasi asosida.
- `/mypage?category=orders` — CLIENT xaridlari va tasdiqlanmagan so‘rovni bekor qilish.
- `/mypage?category=payments` — AGENT uchun to‘lov so‘rovlari.
- `/_admin/products`, `/_admin/users`, `/_admin/attendance`, `/_admin/sales` — faqat ADMIN.

Login yoki signup muvaffaqiyatli bo‘lsa, foydalanuvchi bosh sahifaga (`/`) o‘tadi. AGENT o‘z kartasini tanlasa, `/mypage` ochiladi; boshqa agentlar ommaviy profilga olib boradi. Agentni yoqtirish yurak ikonkasi orqali boshqariladi.

CLIENT mahsulot kartasi yoki detaildagi bookmark ikonkasi bilan saqlaydi. To‘ldirilgan belgi saqlangan holatni bildiradi; mahsulot `/mypage?category=saved` ro‘yxatida ko‘rinadi. Shu ikonka qayta bosilsa, mahsulot saqlanganlardan olinadi.

CLIENT mahsulot kartasining pastki o‘ngidagi savatcha ikonkasi orqali mahsulot qo‘shadi. Navbar'dagi savatcha profil rasmidan oldin joylashgan; unda miqdor, birlik narxi, har bir qator hisobi va jami summa ko‘rinadi. Miqdor minimum, qadam va mavjud qoldiq bilan tekshiriladi. Miqdor × narx har bir qator uchun eng yaqin butun so‘mga yaxlitlanadi (yarim so‘m yuqoriga); jami qatorlar yig‘indisi. Savatcha har bir client ID'si uchun shu brauzerda alohida saqlanadi; refresh/open paytida narx va qoldiq getProduct orqali tekshiriladi. Like va Saved mustaqil qoladi. Savatchaga qo‘shishning o‘zi omborni band qilmaydi.

“To‘lov qilish” tugmasi tanlangan Naqd yoki Bank kartasi turi bilan backendga PENDING savdo so‘rovini yuboradi va mahsulotlarni atomik band qiladi. Narx, birlik, miqdor va jami backendda qayta tekshiriladi. Savatcha faqat muvaffaqiyatli javobdan keyin bo‘shaydi. Tarmoq javobi noma’lum qolsa, ayni requestKey va payload bilan qayta urinish mumkin; shu orada savatcha tahriri bloklanadi.

AGENT “To‘lov so‘rovlari” bo‘limida do‘konda to‘lovni olganini tasdiqlaydi. So‘rov COMPLETED bo‘ladi, jami va band qoldiq sotilgan miqdorga kamayadi. CLIENT o‘zining PENDING so‘rovini bekor qilsa, bandlik bo‘shaydi; tasdiqlangan savdoni bekor qilish funksiyasi yo‘q. ADMIN “Savdolar” bo‘limida Toshkent kuni bo‘yicha tushum, sotilgan mahsulotlar va chek tarixini ko‘radi. Nomi, birlik narxi va miqdor chekda saqlanadi; katalog tahriri tarixni o‘zgartirmaydi. Bu naqd/karta qabulini qayd qilish: online bankdan pul yechish bajarilmaydi. Backend kontrakti: `../quwat/docs/ai/SALES_API.md`.

Mahsulot yaratish DRAFT bilan boshlanadi. Publish/tiklash alohida amal; remove arxivlaydi. ADMIN yaratish va tahrirlash formasidagi “Ombordagi jami miqdor” orqali qoldiqni belgilaydi. Tahrirlashda bu yangi jami qoldiq bo‘ladi; band qilingan miqdor saqlanadi. Qoldiq o‘zgarmasa, forma uni update inputiga yubormaydi. Product narxi butun so‘m, DONA/QOP butun miqdor, METR/KG uch decimalgacha.

Asosiy locale — `uz`; en/kr/ru navigatsiya tarjimalari va locale routing saqlangan. Yangi funksional matnlar o‘zbekcha, to‘liq qo‘shimcha tarjimalar alohida ish.

Agent Shaxsiy bo‘lim → Davomat sahifasida joriy oy to‘liq kalendar sifatida ko‘rinadi; oy tanlab o‘tgan tarix ochiladi. Sana/status filtrlari va kunlar paginationi yo‘q. APPROVED yashil, ABSENT/REJECTED qizil, PENDING sariq; kelajak va davomat hisobi boshlanishidan oldingi kunlar kulrang. “Ishga keldim” faqat bugun uchun requestAttendance yuboradi, tanlangan tarix oyiga so‘rov yaratmaydi.

ADMIN Davomat bo‘limida avval agentlar ro‘yxatini ko‘radi, agentni tanlab ayni oylik kalendarni ochadi. Sariq kun yoki “Ko‘rib chiqish” orqali PENDING so‘rovni tasdiqlaydi/rad etadi; navbat tanlangan oydan tashqaridagi eski so‘rovlarni ham saqlaydi. Tanlangan agentning kalendari getAgentAttendancesByAdmin orqali haqiqiy enrollment chegaralari bilan olinadi. Kunlar filtri yo‘q; agentlar/navbat uzun bo‘lsa pagination bor. Yakuniy qarorlar o‘zgartirilmaydi.

Attendance setup talab qilingan mavjud agentlar uchun backendning alohida rollout skripti operator tomonidan bajariladi. Frontend bu skriptni ishga tushirmaydi. Stock intake, qarz, yetkazib berish va online payment gateway ushbu o‘zgarishga kirmaydi.

Brauzer tekshiruvi natijalari va cheklovlari: [MIGRATION_TESTS.md](MIGRATION_TESTS.md).

## Interfeys tillari

Navbar va admin panelidagi til menyusi butun interfeysni o‘zbek (`uz`), ingliz (`en`), rus (`ru`) yoki koreys (`kr`) tiliga o‘tkazadi. O‘zbekcha asosiy til; boshqa tillarda manzillar `/en`, `/ru`, `/kr` bilan boshlanadi. Til almashtirilganda joriy sahifa va URL filtrlari saqlanadi. Koreyscha sahifaning HTML til kodi `ko`.

Tarjimalar `public/locales/<locale>/common.json` fayllarida. Komponentlar `useText()` orqali matnlarni oladi; yangi yozuv barcha to‘rt lug‘atga qo‘shiladi. Mahsulot nomi/tavsifi, brand, profil ma’lumotlari, izoh va chat xabarlari bazada kiritilgan tilida qoladi. Narxlar barcha tillarda UZS, sana hisobi Asia/Tashkent bo‘lib qoladi.

```bash
yarn check:i18n
yarn test:i18n
```

Birinchi buyruq tarjima kalitlari, parametrlar va tarjimasiz qolgan JSX yozuvlarini tekshiradi. Ikkinchisi tarjimalar, server render, kalendar/statuslar, savdo kartalari, ruscha ko‘plik va xato xabarlarini tekshiradi; database yoki mutation talab qilmaydi.
