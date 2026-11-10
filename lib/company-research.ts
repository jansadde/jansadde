import type { Entry } from './types';

export const companyResearchRevision = '2026-11-07-company-research-v1';

// Research is stored in the same editable entry model as owner-authored content.
// The source and image records travel with each profile when it is edited.
export const companyResearchEntries: Entry[] = [
  {
    id: 'company-tiffany', kind: 'company', title: 'Tiffany & Co.',
    subtitle: 'An American jewelry house with a global design legacy.',
    description: 'Founded in New York City in 1837, Tiffany & Co. grew from a stationery and fancy-goods shop into an international luxury jewelry house. Its identity brings together diamond expertise, precious-metal craftsmanship, influential designers, and a distinctive visual language. Today, the company designs, manufactures, and sells jewelry, watches, and luxury accessories as part of LVMH.',
    period: 'Since 1837', category: 'New York · United States',
    role: 'Luxury jewelry, watches and accessories',
    result: 'Research reviewed on 7 November 2026. Leadership and group membership are supported by the official Tiffany and LVMH sources below. Images are credited to their official source; this is an independent academic company profile.',
    image: '/images/companies/tiffany-craft.jpg',
    isPublic: true, isExample: false, position: 0,
    link: 'https://www.tiffany.com/',
    researchRevision: companyResearchRevision,
    facts: [
      { label: 'Founded', value: '1837 · New York City, United States' },
      { label: 'Founder', value: 'Charles Lewis Tiffany' },
      { label: 'Original business partner', value: 'John B. Young' },
      { label: 'President & CEO', value: 'Anthony Ledru' },
      { label: 'Parent group', value: 'LVMH · acquired in January 2021' },
      { label: 'Industry', value: 'Luxury jewelry, watches and accessories' },
    ],
    sections: [
      {
        heading: 'History and development',
        body: 'Charles Lewis Tiffany and John B. Young opened their New York shop in September 1837, initially selling stationery, imported accessories, and other fine goods. Jewelry and silver became central to its development. The first Blue Book appeared in 1845, creating a lasting connection between the house, its clients, and its most exceptional creations. In 1853, after his partners retired, Charles Tiffany took control and the business adopted the Tiffany & Co. name. International exhibitions, gemstone acquisitions, and a growing reputation for silver and jewelry helped establish the house beyond the United States.',
      },
      {
        heading: 'Leadership and ownership',
        body: 'Charles Lewis Tiffany is the founder; John B. Young was his original business partner. Anthony Ledru is the current President and Chief Executive Officer, as identified by Tiffany’s official leadership pages. He took up the role in January 2021. LVMH completed its acquisition of Tiffany & Co. on 7 January 2021, bringing the American house into the group’s Watches & Jewelry division. These roles distinguish the historical founders from today’s executive leadership and parent company.',
      },
      {
        heading: 'Company characteristics',
        body: 'Tiffany occupies the luxury end of the jewelry market. Its design identity balances recognizable forms with specialist work in diamonds, colored gemstones, gold, platinum, and silver. The Tiffany Setting made the raised solitaire engagement ring a defining design; Tiffany Blue and the Blue Box add a recognizable visual signature. The house’s own workshops and its long relationships with designers connect handcraft with continuing product development. Its international store network and New York flagship, The Landmark, express that heritage through a contemporary retail experience.',
      },
      {
        heading: 'Products and signature collections',
        body: 'The offer spans engagement and wedding jewelry, high jewelry, everyday fine jewelry, timepieces, and accessories. Signature families include Tiffany T, HardWear, Lock, Knot, and Jean Schlumberger’s Sixteen Stone, alongside the Tiffany Setting. Elsa Peretti’s sculptural designs, including the Bone cuff, show a different side of the house: organic form and simplicity. Blue Book continues as a setting for exceptional high jewelry and gemstones. These collections provide distinct design vocabularies within one recognizable brand.',
      },
      {
        heading: 'International presence and contribution',
        body: 'Tiffany helped give American jewelry and silver an international profile, including recognition for its silver at the 1867 Paris World’s Fair. The house’s contribution also includes the 1886 Tiffany Setting and its collaborations with major jewelry designers. Its contemporary position combines a worldwide retail presence with renewed investment in its heritage: The Landmark reopened in 2023 after a comprehensive transformation of the Fifth Avenue flagship. The company remains an American jewelry house within a global luxury group.',
      },
    ],
    timeline: [
      { year: '1837', title: 'A New York beginning', body: 'Charles Lewis Tiffany and John B. Young open a stationery and fancy-goods shop in New York City.' },
      { year: '1845', title: 'The first Blue Book', body: 'The first catalogue establishes a tradition that develops into today’s Blue Book high-jewelry presentation.' },
      { year: '1853', title: 'Tiffany & Co.', body: 'Charles Tiffany assumes control after his partners retire, and the company takes its enduring name.' },
      { year: '1886', title: 'The Tiffany Setting', body: 'The six-prong solitaire setting raises the diamond above the band and becomes a signature engagement-ring design.' },
      { year: '1974', title: 'Elsa Peretti joins the house', body: 'Her organic, sculptural approach introduces a new and lasting design language at Tiffany.' },
      { year: '2021', title: 'A new chapter with LVMH', body: 'LVMH completes the acquisition on 7 January; Anthony Ledru becomes Chief Executive Officer.' },
      { year: '2023', title: 'The Landmark reopens', body: 'The transformed Fifth Avenue flagship opens in April, connecting jewelry, architecture, art, and hospitality.' },
    ],
    gallery: [
      { src: '/images/companies/tiffany-diamond.jpg', alt: 'The yellow Tiffany Diamond in a Bird on a Rock setting', caption: 'The Tiffany Diamond in Jean Schlumberger’s Bird on a Rock setting. © Tiffany & Co.; official LVMH company presentation.', sourceUrl: 'https://www.lvmh.com/en/our-maisons/watches-jewelry/tiffany-co' },
      { src: '/images/companies/tiffany-craft.jpg', alt: 'A jeweler examining a colored-gemstone necklace with a loupe', caption: 'Gemstone jewelry inspection. © Tiffany & Co.; official LVMH company presentation.', sourceUrl: 'https://www.lvmh.com/en/our-maisons/watches-jewelry/tiffany-co' },
      { src: '/images/companies/tiffany-diamonds.jpg', alt: 'A selection of faceted Tiffany diamonds in different cuts', caption: 'Diamond cuts from the house’s official imagery. © Tiffany & Co.; official LVMH company presentation.', sourceUrl: 'https://www.lvmh.com/en/our-maisons/watches-jewelry/tiffany-co' },
    ],
    sources: [
      { title: 'Tiffany — Charles Lewis Tiffany: founder, John B. Young and early development', url: 'https://press.tiffany.com/spokespeople/charles-lewis-tiffany/' },
      { title: 'Tiffany — the house’s legacy and the 1845 Blue Book', url: 'https://press.tiffany.com/our-story/tiffanys-legacy-pioneer-of-american-luxury/' },
      { title: 'Tiffany — the Tiffany Setting', url: 'https://press.tiffany.com/the-collections/the-tiffany-setting/' },
      { title: 'Tiffany — Elsa Peretti and the 1974 design partnership', url: 'https://press.tiffany.com/the-designers/elsa-peretti/' },
      { title: 'Tiffany — the heritage and identity of the Blue Box', url: 'https://www.tiffany.com/world-of-tiffany/heritage/blue-box-story.html' },
      { title: 'Tiffany & Co. Foundation — Anthony Ledru, President and CEO', url: 'https://www.tiffanyandcofoundation.org/about/anthony-ledru.html' },
      { title: 'LVMH and Tiffany — completed acquisition, 7 January 2021 (SEC-filed release)', url: 'https://www.sec.gov/Archives/edgar/data/98246/000119312521004213/d301758dex991.htm' },
      { title: 'LVMH — current Tiffany company profile, collections, Landmark and official photography', url: 'https://www.lvmh.com/en/our-maisons/watches-jewelry/tiffany-co' },
    ],
  },
  {
    id: 'company-kazakhyuvelir', kind: 'company', title: 'KazakhYuvelir',
    subtitle: 'Kazakh jewelry heritage, reinterpreted through contemporary design.',
    description: 'KazakhYuvelir is a Kazakhstan jewelry business whose historical roots date to 1941. Its present-day activities combine jewelry design, manufacturing, and retail, with collections that explore Kazakh ornament, cultural memory, and modern form. The historical organization and the current joint-stock legal entity have different dates: the heritage begins in 1941, while the current entity’s initial state registration is 14 October 1993.',
    period: 'Heritage since 1941', category: 'Kazakhstan',
    role: 'Jewelry manufacturing, design and retail',
    result: '1941 is the historical foundation, not the registration date of the present legal entity. Aida Dabyrovna Inkerbayeva is identified as First Executive in Kompra’s public registry record, whose directly reviewed leadership snapshot is dated 5 November 2026. This registry attribution does not establish the complete current shareholding or replace an official appointment document.',
    image: '/images/companies/kazakhyuvelir-yurt.jpg',
    isPublic: true, isExample: false, position: 1,
    link: 'https://kazakhyuvelir.kz/',
    researchRevision: companyResearchRevision,
    facts: [
      { label: 'Historical foundation', value: '1941 · Kazakhstan' },
      { label: 'Historical origin', value: 'Kazakh branch of the Soviet Yuvelirtorg jewelry-trade organization' },
      { label: 'Current legal entity', value: 'KazakhYuvelir JSC · BIN 931040000164' },
      { label: 'Initial state registration', value: '14 October 1993' },
      { label: 'First Executive · registry record', value: 'Aida Dabyrovna Inkerbayeva · snapshot dated 5 November 2026' },
      { label: 'Industry', value: 'Jewelry manufacturing, design and retail' },
    ],
    sections: [
      {
        heading: 'History and development',
        body: 'The company traces its institutional history to 1941. In a published 2015 interview, its then-president described the origin as the independent Kazakh branch of the Soviet Yuvelirtorg organization under the USSR trade administration. This was a state jewelry-trade institution, so an individual entrepreneur should not be presented as its founder. The business developed through Soviet-era trading structures and the transition to Kazakhstan’s modern jewelry market. The same interview dates its own manufacturing operation to 2004. Its current presentation places that history alongside an active design practice and a network of jewelry salons.',
      },
      {
        heading: 'Leadership and legal identity',
        body: 'The Kazakhstan Financial Reporting Depository identifies the joint-stock company with BIN 931040000164 and records initial state registration on 14 October 1993. That corporate date is separate from the 1941 historical origin. Kompra’s public company-registry record names Aida Dabyrovna Inkerbayeva as First Executive; the directly reviewed leadership snapshot is dated 5 November 2026. The registry describes private ownership. The public sources reviewed do not establish the complete current shareholding, and no individual founder or beneficial owner is inferred from the historical institution.',
      },
      {
        heading: 'Company characteristics',
        body: 'Kazakh cultural heritage is central to the house’s stated design approach. Traditional motifs and the meaning of ornaments provide a starting point for new forms rather than simply a decorative surface. The company connects that research with contemporary jewelry design, precious metals, gemstones, and manual finishing. Its work includes both culturally specific collections and pieces for daily wear. Manufacturing and retail are linked: its official company page describes its own factory and salons across Kazakhstan, connecting production expertise with a national customer-facing presence.',
      },
      {
        heading: 'Products and jewelry collections',
        body: 'The official collection architecture includes enduring collections, heritage collections, everyday lines, atelier pieces, and collaborations. Named families include Yurt, Zere, Otau, Tansari, Anağa Tağzym, Roza, Batyr, and Sätti. Yurt uses circular form and traditional ornament to explore balance and continuity. Its official collection page identifies yellow and white gold, mother-of-pearl, turquoise, diamonds, and malachite among its materials. The wider catalogue includes rings, earrings, necklaces, bracelets, and chains in gold and silver. Product names and availability may change; the official catalogue remains the purchasing reference.',
      },
      {
        heading: 'Contemporary manufacturing and craft',
        body: 'KazakhYuvelir describes a production process that begins with historical and visual research, then develops through concepts, sketches, and 3D models. Prototyping and casting bring the design into metal. Hand finishing and stone setting follow, before polishing, quality control, and certification. This combination of digital tools and manual work supports the company’s contemporary direction while retaining a connection to Kazakh jewelry traditions. The account is the company’s own description of its process, rather than an independent factory audit.',
      },
    ],
    timeline: [
      { year: '1941', title: 'Institutional beginnings', body: 'The historical organization originates as the Kazakh branch of Soviet Yuvelirtorg, according to the company’s historical account and its former president’s published interview.' },
      { year: '1993', title: 'A separate legal-registration milestone', body: 'The current joint-stock legal entity is initially registered on 14 October. This is not the foundation date of the historical institution.' },
      { year: '2003', title: 'Corporate re-registration', body: 'The Financial Reporting Depository records re-registration on 10 September 2003, another legal milestone in the current entity’s history.' },
      { year: '2004', title: 'An in-house manufacturing operation', body: 'The company’s then-president dates the establishment of its own jewelry production to 2004 in a published 2015 interview.' },
      { year: 'Today', title: 'Heritage in contemporary form', body: 'The official collection and production pages present cultural research, digital modeling, hand finishing, and jewelry retail as parts of one modern practice.' },
    ],
    gallery: [
      { src: '/images/companies/kazakhyuvelir-yurt.jpg', alt: 'Gold and green-stone jewelry from the KazakhYuvelir Yurt collection', caption: 'Yurt collection imagery, published by KazakhYuvelir. © KazakhYuvelir.', sourceUrl: 'https://kazakhyuvelir.kz/collections/iurt' },
      { src: '/images/companies/kazakhyuvelir-craft.jpg', alt: 'A craftsperson working by hand on an ornamental cuff', caption: 'Manual finishing from the house’s official production story. © KazakhYuvelir.', sourceUrl: 'https://kazakhyuvelir.kz/about/production' },
      { src: '/images/companies/kazakhyuvelir-yurt-detail.jpg', alt: 'A craftsperson examining a green-stone Yurt ring above jewelry sketches', caption: 'A closer look at Yurt’s ornament and making process. © KazakhYuvelir.', sourceUrl: 'https://kazakhyuvelir.kz/collections/iurt' },
    ],
    sources: [
      { title: 'KazakhYuvelir — official company history, heritage and retail/manufacturing profile', url: 'https://kazakhyuvelir.kz/about' },
      { title: 'KazakhYuvelir — official production process', url: 'https://kazakhyuvelir.kz/about/production' },
      { title: 'KazakhYuvelir — official collection architecture', url: 'https://kazakhyuvelir.kz/collections' },
      { title: 'KazakhYuvelir — Yurt collection, materials, motifs and official imagery', url: 'https://kazakhyuvelir.kz/collections/iurt' },
      { title: 'Kazakhstan Financial Reporting Depository — legal entity record, BIN 931040000164', url: 'https://opi.dfo.kz/ru/opi/list/278746076840000000/view' },
      { title: 'Kompra — public company-registry leadership record (snapshot dated 5 November 2026)', url: 'https://kompra.kz/organization/931040000164' },
      { title: 'Jewelry trade press — 2015 interview with the then-president on the Yuvelirtorg origin', url: 'https://njt.ru/archive/2015/15-03/20160/' },
    ],
  },
];
