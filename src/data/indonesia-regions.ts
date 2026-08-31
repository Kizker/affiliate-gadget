export interface RegionCity {
  name: string
  postalCode?: string
  districts?: string[]
}

export interface RegionProvince {
  name: string
  cities: RegionCity[]
}

export const INDONESIA_PROVINCES: RegionProvince[] = [
  {
    name: 'DKI Jakarta',
    cities: [
      {
        name: 'Jakarta Selatan',
        postalCode: '12110',
        districts: ['Kebayoran Baru', 'Kebayoran Lama', 'Pesanggrahan', 'Cilandak', 'Pasar Minggu', 'Jagakarsa', 'Mampang Prapatan', 'Pancoran', 'Tebet', 'Setiabudi'],
      },
      {
        name: 'Jakarta Pusat',
        postalCode: '10110',
        districts: ['Gambir', 'Tanah Abang', 'Menteng', 'Senen', 'Cempaka Putih', 'Johar Baru', 'Kemayoran', 'Sawah Besar'],
      },
      {
        name: 'Jakarta Barat',
        postalCode: '11110',
        districts: ['Cengkareng', 'Grogol Petamburan', 'Taman Sari', 'Tambora', 'Kebon Jeruk', 'Kalideres', 'Palmerah', 'Kembangan'],
      },
      {
        name: 'Jakarta Timur',
        postalCode: '13110',
        districts: ['Matraman', 'Pulo Gadung', 'Jatinegara', 'Duren Sawit', 'Kramat Jati', 'Makasar', 'Pasar Rebo', 'Ciracas', 'Cipayung', 'Cakung'],
      },
      {
        name: 'Jakarta Utara',
        postalCode: '14110',
        districts: ['Penjaringan', 'Tanjung Priok', 'Koja', 'Cilincing', 'Pademangan', 'Kelapa Gading'],
      },
      {
        name: 'Kepulauan Seribu',
        postalCode: '14510',
        districts: ['Kepulauan Seribu Utara', 'Kepulauan Seribu Selatan'],
      },
    ],
  },
  {
    name: 'Jawa Barat',
    cities: [
      { name: 'Kota Bandung', postalCode: '40111', districts: ['Coblong', 'Cicendo', 'Andir', 'Sukasari', 'Sumur Bandung', 'Regol', 'Batununggal', 'Buahbatu'] },
      { name: 'Kabupaten Bandung', postalCode: '40311', districts: ['Soreang', 'Baleendah', 'Banjaran', 'Bojongsoang', 'Cileunyi', 'Katapang', 'Margahayu'] },
      { name: 'Kabupaten Bandung Barat', postalCode: '40552', districts: ['Ngamprah', 'Lembang', 'Padalarang', 'Parongpong', 'Cisarua', 'Batujajar'] },
      { name: 'Kota Bekasi', postalCode: '17111', districts: ['Bekasi Barat', 'Bekasi Timur', 'Bekasi Utara', 'Bekasi Selatan', 'Rawalumbu', 'Medan Satria', 'Pondok Gede', 'Jatiasih'] },
      { name: 'Kabupaten Bekasi', postalCode: '17530', districts: ['Cikarang Pusat', 'Cikarang Barat', 'Cikarang Timur', 'Cikarang Utara', 'Cikarang Selatan', 'Tambun Selatan'] },
      { name: 'Kota Bogor', postalCode: '16111', districts: ['Bogor Tengah', 'Bogor Barat', 'Bogor Selatan', 'Bogor Timur', 'Bogor Utara', 'Tanah Sareal'] },
      { name: 'Kabupaten Bogor', postalCode: '16911', districts: ['Cibinong', 'Babakan Madang', 'Bojonggede', 'Cileungsi', 'Citeureup', 'Gunung Putri', 'Cisarua'] },
      { name: 'Kota Depok', postalCode: '16411', districts: ['Pancoran Mas', 'Sukmajaya', 'Cimanggis', 'Beji', 'Sawangan', 'Limo', 'Cinere', 'Tapos'] },
      { name: 'Kota Cimahi', postalCode: '40511', districts: ['Cimahi Tengah', 'Cimahi Utara', 'Cimahi Selatan'] },
      { name: 'Kota Cirebon', postalCode: '45111', districts: ['Kejaksan', 'Kesambi', 'Lemahwungkuk', 'Pekalipan', 'Harjamukti'] },
      { name: 'Kabupaten Cirebon', postalCode: '45611', districts: ['Sumber', 'Kedawung', 'Weru', 'Plumbon', 'Palimanan', 'Arjawinangun'] },
      { name: 'Kabupaten Karawang', postalCode: '41311', districts: ['Karawang Barat', 'Karawang Timur', 'Telukjambe Timur', 'Klari', 'Cikampek'] },
      { name: 'Kota Sukabumi', postalCode: '43111', districts: ['Cikole', 'Citamiang', 'Warudoyong', 'Baros', 'Lembursitu', 'Gunungpuyuh'] },
      { name: 'Kabupaten Sukabumi', postalCode: '43311', districts: ['Palabuhanratu', 'Cibadak', 'Cisaat', 'Cicurug', 'Surade'] },
      { name: 'Kota Tasikmalaya', postalCode: '46111', districts: ['Cihideung', 'Cipedes', 'Tawang', 'Indihiang', 'Kawalu', 'Mangkubumi'] },
      { name: 'Kabupaten Tasikmalaya', postalCode: '46411', districts: ['Singaparna', 'Manonjaya', 'Ciawi', 'Karangnunggal'] },
      { name: 'Kabupaten Garut', postalCode: '44111', districts: ['Garut Kota', 'Tarogong Kidul', 'Tarogong Kaler', 'Samarang', 'Leles', 'Kadungora'] },
      { name: 'Kabupaten Sumedang', postalCode: '45311', districts: ['Sumedang Utara', 'Sumedang Selatan', 'Jatinangor', 'Tanjungsari'] },
      { name: 'Kabupaten Purwakarta', postalCode: '41111', districts: ['Purwakarta', 'Jatiluhur', 'Campaka', 'Bungursari'] },
      { name: 'Kabupaten Subang', postalCode: '41211', districts: ['Subang', 'Kalijati', 'Pamanukan', 'Pagaden'] },
      { name: 'Kabupaten Indramayu', postalCode: '45211', districts: ['Indramayu', 'Jatibarang', 'Haurgeulis', 'Kandanghaur'] },
      { name: 'Kabupaten Majalengka', postalCode: '45411', districts: ['Majalengka', 'Jatiwangi', 'Kadipaten', 'Kertajati'] },
      { name: 'Kabupaten Kuningan', postalCode: '45511', districts: ['Kuningan', 'Cigugur', 'Cilimus', 'Jalaksana'] },
      { name: 'Kabupaten Ciamis', postalCode: '46211', districts: ['Ciamis', 'Kawali', 'Panumbangan', 'Rancah'] },
      { name: 'Kota Banjar', postalCode: '46311', districts: ['Banjar', 'Purwaharja', 'Pataruman', 'Langensari'] },
      { name: 'Kabupaten Pangandaran', postalCode: '46396', districts: ['Parigi', 'Pangandaran', 'Kalipucang', 'Cijulang'] },
      { name: 'Kabupaten Cianjur', postalCode: '43211', districts: ['Cianjur', 'Cipanas', 'Pacet', 'Ciranjang', 'Karangtengah'] },
    ],
  },
  {
    name: 'Banten',
    cities: [
      { name: 'Kota Tangerang', postalCode: '15111', districts: ['Tangerang', 'Batuceper', 'Benda', 'Cibodas', 'Ciledug', 'Cipondoh', 'Jatiuwung', 'Karawaci', 'Neglasari', 'Pinang'] },
      { name: 'Kota Tangerang Selatan', postalCode: '15411', districts: ['Serpong', 'Serpong Utara', 'Pondok Aren', 'Ciputat', 'Ciputat Timur', 'Pamulang', 'Setu'] },
      { name: 'Kabupaten Tangerang', postalCode: '15911', districts: ['Tigaraksa', 'Balaraja', 'Cikupa', 'Curug', 'Kelapa Dua', 'Pasar Kemis', 'Legok', 'Panongan'] },
      { name: 'Kota Serang', postalCode: '42111', districts: ['Serang', 'Cipocok Jaya', 'Curug', 'Kasemen', 'Taktakan', 'Walantaka'] },
      { name: 'Kabupaten Serang', postalCode: '42162', districts: ['Ciruas', 'Kramatwatu', 'Anyar', 'Cinangka', 'Cikande', 'Kragilan'] },
      { name: 'Kota Cilegon', postalCode: '42411', districts: ['Cilegon', 'Cibeber', 'Citangkil', 'Ciwandan', 'Grogol', 'Jombang', 'Pulomerak', 'Purwakarta'] },
      { name: 'Kabupaten Lebak', postalCode: '42311', districts: ['Rangkasbitung', 'Maja', 'Cibadak', 'Bayah', 'Malingping'] },
      { name: 'Kabupaten Pandeglang', postalCode: '42211', districts: ['Pandeglang', 'Majasari', 'Labuan', 'Menes', 'Panimbang'] },
    ],
  },
  {
    name: 'Jawa Tengah',
    cities: [
      { name: 'Kota Semarang', postalCode: '50111', districts: ['Semarang Tengah', 'Semarang Barat', 'Semarang Timur', 'Semarang Selatan', 'Semarang Utara', 'Banyumanik', 'Candisari', 'Gajahmungkur', 'Gayamsari', 'Genuk', 'Gunungpati', 'Mijen', 'Ngaliyan', 'Pedurungan', 'Tembalang', 'Tugu'] },
      { name: 'Kota Surakarta (Solo)', postalCode: '57111', districts: ['Banjarsari', 'Jebres', 'Laweyan', 'Pasar Kliwon', 'Serengan'] },
      { name: 'Kabupaten Sleman / Solo Raya (Sukoharjo)', postalCode: '57511', districts: ['Sukoharjo', 'Kartasura', 'Grogol', 'Baki', 'Mojolaban'] },
      { name: 'Kabupaten Boyolali', postalCode: '57311', districts: ['Boyolali', 'Mojosongo', 'Teras', 'Ampel'] },
      { name: 'Kabupaten Klaten', postalCode: '57411', districts: ['Klaten Utara', 'Klaten Tengah', 'Klaten Selatan', 'Delanggu', 'Prambanan'] },
      { name: 'Kabupaten Karanganyar', postalCode: '57711', districts: ['Karanganyar', 'Colomadu', 'Jaten', 'Tasikmadu'] },
      { name: 'Kabupaten Wonogiri', postalCode: '57611', districts: ['Wonogiri', 'Selogiri', 'Baturetno', 'Pratitan'] },
      { name: 'Kabupaten Sragen', postalCode: '57211', districts: ['Sragen', 'Gemolong', 'Masaran', 'Sambungmacan'] },
      { name: 'Kota Magelang', postalCode: '56111', districts: ['Magelang Utara', 'Magelang Tengah', 'Magelang Selatan'] },
      { name: 'Kabupaten Magelang', postalCode: '56511', districts: ['Mertoyudan', 'Muntilan', 'Borobudur', 'Secang'] },
      { name: 'Kabupaten Banyumas (Purwokerto)', postalCode: '53111', districts: ['Purwokerto Timur', 'Purwokerto Barat', 'Purwokerto Utara', 'Purwokerto Selatan', 'Sokaraja', 'Baturraden'] },
      { name: 'Kabupaten Cilacap', postalCode: '53211', districts: ['Cilacap Tengah', 'Cilacap Utara', 'Cilacap Selatan', 'Majenang', 'Kroya'] },
      { name: 'Kota Pekalongan', postalCode: '51111', districts: ['Pekalongan Barat', 'Pekalongan Timur', 'Pekalongan Utara', 'Pekalongan Selatan'] },
      { name: 'Kota Tegal', postalCode: '52111', districts: ['Tegal Barat', 'Tegal Timur', 'Tegal Selatan', 'Margadana'] },
      { name: 'Kota Salatiga', postalCode: '50711', districts: ['Sidorejo', 'Tingkir', 'Argomulyo', 'Sidomukti'] },
      { name: 'Kabupaten Kudus', postalCode: '59311', districts: ['Kota Kudus', 'Jati', 'Gebog', 'Kaliwungu'] },
      { name: 'Kabupaten Jepara', postalCode: '59411', districts: ['Jepara', 'Tahunan', 'Batealit', 'Mlonggo'] },
      { name: 'Kabupaten Pati', postalCode: '59111', districts: ['Pati', 'Juwana', 'Margorejo', 'Tayu'] },
    ],
  },
  {
    name: 'DI Yogyakarta',
    cities: [
      { name: 'Kota Yogyakarta', postalCode: '55111', districts: ['Danurejan', 'Gedongtengen', 'Gondokusuman', 'Gondomanan', 'Jetis', 'Kotagede', 'Kraton', 'Mantrijeron', 'Mergangsan', 'Ngampilan', 'Pakualaman', 'Tegalrejo', 'Umbulharjo', 'Wirobrajan'] },
      { name: 'Kabupaten Sleman', postalCode: '55281', districts: ['Depok', 'Mlati', 'Ngaglik', 'Gamping', 'Kalasan', 'Sleman', 'Berbah', 'Godean'] },
      { name: 'Kabupaten Bantul', postalCode: '55711', districts: ['Bantul', 'Sewon', 'Kasihan', 'Banguntapan', 'Piyungan', 'Imogiri'] },
      { name: 'Kabupaten Kulon Progo', postalCode: '55611', districts: ['Wates', 'Temon', 'Pengasih', 'Sentolo'] },
      { name: 'Kabupaten Gunungkidul', postalCode: '55811', districts: ['Wonosari', 'Playen', 'Semanu', 'Karangmojo'] },
    ],
  },
  {
    name: 'Jawa Timur',
    cities: [
      { name: 'Kota Surabaya', postalCode: '60111', districts: ['Gubeng', 'Tegalsari', 'Genteng', 'Wonokromo', 'Rungkut', 'Sukolilo', 'Sambikerep', 'Dukuh Pakis', 'Sawahan', 'Kenjeran', 'Wiyung', 'Mulyorejo', 'Tambaksari', 'Jambangan', 'Gayungan', 'Wonocolo'] },
      { name: 'Kabupaten Sidoarjo', postalCode: '61211', districts: ['Sidoarjo', 'Waru', 'Gedangan', 'Candi', 'Taman', 'Krian', 'Sedati', 'Buduran', 'Sukodono'] },
      { name: 'Kabupaten Gresik', postalCode: '61111', districts: ['Gresik', 'Kebomas', 'Manyar', 'Driyorejo', 'Menganti'] },
      { name: 'Kota Malang', postalCode: '65111', districts: ['Klojen', 'Blimbing', 'Lowokwaru', 'Sukun', 'Kedungkandang'] },
      { name: 'Kabupaten Malang', postalCode: '65163', districts: ['Kepanjeng', 'Singosari', 'Lawang', 'Pakis', 'Dau'] },
      { name: 'Kota Batu', postalCode: '65311', districts: ['Batu', 'Bumiaji', 'Junrejo'] },
      { name: 'Kota Kediri', postalCode: '64111', districts: ['Kota', 'Mojoroto', 'Pesantren'] },
      { name: 'Kabupaten Kediri', postalCode: '64182', districts: ['Pare', 'Ngadiluwih', 'Gurah', 'Gampengrejo'] },
      { name: 'Kota Madiun', postalCode: '63111', districts: ['Kartoharjo', 'Manguharjo', 'Taman'] },
      { name: 'Kabupaten Jember', postalCode: '68111', districts: ['Kaliwates', 'Sumbersari', 'Patrang', 'Tanggul'] },
      { name: 'Kabupaten Banyuwangi', postalCode: '68411', districts: ['Banyuwangi', 'Rogojampi', 'Genteng', 'Giri', 'Kabat'] },
      { name: 'Kota Pasuruan', postalCode: '67111', districts: ['Bugul Kidul', 'Gadingrejo', 'Purworejo', 'Panggungrejo'] },
      { name: 'Kabupaten Pasuruan', postalCode: '67115', districts: ['Bangil', 'Pandaan', 'Gempol', 'Sukorejo', 'Prigen'] },
      { name: 'Kota Probolinggo', postalCode: '67211', districts: ['Mayangan', 'Kanigaran', 'Kademangan', 'Wonoasih', 'Kedopok'] },
      { name: 'Kabupaten Mojokerto', postalCode: '61382', districts: ['Mojosari', 'Puri', 'Sooko', 'Trowulan', 'Ngoro'] },
      { name: 'Kota Mojokerto', postalCode: '61311', districts: ['Magersari', 'Prajurit Kulon', 'Krangan'] },
    ],
  },
  {
    name: 'Bali',
    cities: [
      { name: 'Kota Denpasar', postalCode: '80111', districts: ['Denpasar Barat', 'Denpasar Timur', 'Denpasar Selatan', 'Denpasar Utara'] },
      { name: 'Kabupaten Badung', postalCode: '80351', districts: ['Kuta', 'Kuta Selatan', 'Kuta Utara', 'Mengwi', 'Abiansemal', 'Petang'] },
      { name: 'Kabupaten Gianyar', postalCode: '80511', districts: ['Gianyar', 'Ubud', 'Sukawati', 'Blahbatuh', 'Tegallalang'] },
      { name: 'Kabupaten Tabanan', postalCode: '82111', districts: ['Tabanan', 'Kediri', 'Kerambitan', 'Baturiti'] },
      { name: 'Kabupaten Buleleng (Singaraja)', postalCode: '81111', districts: ['Buleleng', 'Sukasada', 'Seririt', 'Banjar'] },
    ],
  },
  {
    name: 'Sumatera Utara',
    cities: [
      { name: 'Kota Medan', postalCode: '20111', districts: ['Medan Kota', 'Medan Baru', 'Medan Barat', 'Medan Timur', 'Medan Petisah', 'Medan Helvetia', 'Medan Sunggal', 'Medan Selayang', 'Medan Tembung', 'Medan Deli', 'Medan Amplas', 'Medan Johor', 'Medan Denai'] },
      { name: 'Kabupaten Deli Serdang', postalCode: '20511', districts: ['Lubuk Pakam', 'Percut Sei Tuan', 'Sunggal', 'Tanjung Morawa', 'Batang Kuis'] },
      { name: 'Kota Binjai', postalCode: '20711', districts: ['Binjai Kota', 'Binjai Barat', 'Binjai Timur', 'Binjai Utara', 'Binjai Selatan'] },
      { name: 'Kota Pematangsiantar', postalCode: '21111', districts: ['Siantar Barat', 'Siantar Timur', 'Siantar Selatan', 'Siantar Utara'] },
    ],
  },
  {
    name: 'Sumatera Barat',
    cities: [
      { name: 'Kota Padang', postalCode: '25111', districts: ['Padang Barat', 'Padang Timur', 'Padang Utara', 'Padang Selatan', 'Koto Tangah', 'Kuranji', 'Nanggalo'] },
      { name: 'Kota Bukittinggi', postalCode: '26111', districts: ['Guguk Panjang', 'Mandiangin Koto Selayan', 'Aur Birugo Tigo Baleh'] },
    ],
  },
  {
    name: 'Riau',
    cities: [
      { name: 'Kota Pekanbaru', postalCode: '28111', districts: ['Sukajadi', 'Senapelan', 'Pekanbaru Kota', 'Limapuluh', 'Sail', 'Bukit Raya', 'Marpoyan Damai', 'Payung Sekaki', 'Tampan'] },
      { name: 'Kota Dumai', postalCode: '28811', districts: ['Dumai Kota', 'Dumai Barat', 'Dumai Timur', 'Dumai Selatan'] },
    ],
  },
  {
    name: 'Kepulauan Riau',
    cities: [
      { name: 'Kota Batam', postalCode: '29411', districts: ['Batam Kota', 'Lubuk Baja', 'Batu Ampar', 'Bengkong', 'Sekupang', 'Nongsa', 'Sagulung', 'Batu Aji'] },
      { name: 'Kota Tanjungpinang', postalCode: '29111', districts: ['Tanjungpinang Kota', 'Tanjungpinang Barat', 'Tanjungpinang Timur', 'Bukit Bestari'] },
    ],
  },
  {
    name: 'Sumatera Selatan',
    cities: [
      { name: 'Kota Palembang', postalCode: '30111', districts: ['Ilir Barat I', 'Ilir Barat II', 'Ilir Timur I', 'Ilir Timur II', 'Seberang Ulu I', 'Seberang Ulu II', 'Sukarami', 'Alang-Alang Lebar', 'Kemuning'] },
    ],
  },
  {
    name: 'Lampung',
    cities: [
      { name: 'Kota Bandar Lampung', postalCode: '35111', districts: ['Tanjung Karang Pusat', 'Tanjung Karang Timur', 'Tanjung Karang Barat', 'Kedaton', 'Rajabasa', 'Sukarame', 'Enggal', 'Teluk Betung Selatan'] },
      { name: 'Kota Metro', postalCode: '34111', districts: ['Metro Pusat', 'Metro Barat', 'Metro Timur', 'Metro Selatan', 'Metro Utara'] },
    ],
  },
  {
    name: 'Kalimantan Timur',
    cities: [
      { name: 'Kota Balikpapan', postalCode: '76111', districts: ['Balikpapan Kota', 'Balikpapan Tengah', 'Balikpapan Selatan', 'Balikpapan Barat', 'Balikpapan Utara', 'Balikpapan Timur'] },
      { name: 'Kota Samarinda', postalCode: '75111', districts: ['Samarinda Kota', 'Samarinda Ulu', 'Samarinda Ilir', 'Samarinda Utara', 'Sungai Kunjang', 'Palaran'] },
      { name: 'Kabupaten Penajam Paser Utara (IKN)', postalCode: '76141', districts: ['Penajam', 'Sepaku', 'Waru', 'Babulu'] },
    ],
  },
  {
    name: 'Kalimantan Selatan',
    cities: [
      { name: 'Kota Banjarmasin', postalCode: '70111', districts: ['Banjarmasin Tengah', 'Banjarmasin Barat', 'Banjarmasin Timur', 'Banjarmasin Selatan', 'Banjarmasin Utara'] },
      { name: 'Kota Banjarbaru', postalCode: '70711', districts: ['Banjarbaru Utara', 'Banjarbaru Selatan', 'Landasan Ulin', 'Cempaka', 'Liang Anggang'] },
    ],
  },
  {
    name: 'Kalimantan Barat',
    cities: [
      { name: 'Kota Pontianak', postalCode: '78111', districts: ['Pontianak Kota', 'Pontianak Barat', 'Pontianak Selatan', 'Pontianak Timur', 'Pontianak Utara', 'Pontianak Tenggara'] },
      { name: 'Kota Singkawang', postalCode: '79111', districts: ['Singkawang Barat', 'Singkawang Tengah', 'Singkawang Timur', 'Singkawang Utara', 'Singkawang Selatan'] },
    ],
  },
  {
    name: 'Sulawesi Selatan',
    cities: [
      { name: 'Kota Makassar', postalCode: '90111', districts: ['Ujung Pandang', 'Mariso', 'Mamajang', 'Makassar', 'Ujung Tanah', 'Wajo', 'Bontoala', 'Tallo', 'Panakkukang', 'Tamalate', 'Biringkanaya', 'Manggala', 'Rappocini', 'Tamalanrea'] },
      { name: 'Kabupaten Gowa', postalCode: '92111', districts: ['Somba Opu', 'Pallangga', 'Bontomarannu', 'Bajeng'] },
      { name: 'Kota Parepare', postalCode: '91111', districts: ['Ujung', 'Soreang', 'Bacukiki', 'Bacukiki Barat'] },
    ],
  },
  {
    name: 'Sulawesi Utara',
    cities: [
      { name: 'Kota Manado', postalCode: '95111', districts: ['Wenang', 'Wanea', 'Sario', 'Malalayang', 'Tikala', 'Paal Dua', 'Mapanget', 'Singkil', 'Tuminting', 'Bunaken'] },
      { name: 'Kota Tomohon', postalCode: '95411', districts: ['Tomohon Tengah', 'Tomohon Utara', 'Tomohon Selatan', 'Tomohon Barat', 'Tomohon Timur'] },
    ],
  },
  {
    name: 'Nusa Tenggara Barat',
    cities: [
      { name: 'Kota Mataram', postalCode: '83111', districts: ['Mataram', 'Ampenan', 'Cakranegara', 'Sekarbela', 'Selaparang', 'Sandubaya'] },
    ],
  },
  {
    name: 'Nusa Tenggara Timur',
    cities: [
      { name: 'Kota Kupang', postalCode: '85111', districts: ['Oebobo', 'Kelapa Lima', 'Kota Raja', 'Maulafa', 'Alak', 'Kota Lama'] },
    ],
  },
  {
    name: 'Papua',
    cities: [
      { name: 'Kota Jayapura', postalCode: '99111', districts: ['Jayapura Utara', 'Jayapura Selatan', 'Abepura', 'Heram', 'Muara Tami'] },
    ],
  },
  {
    name: 'Aceh',
    cities: [
      { name: 'Kota Banda Aceh', postalCode: '23111', districts: ['Kuta Alam', 'Baiturrahman', 'Meuraxa', 'Syiah Kuala', 'Ulee Kareng', 'Lueng Bata', 'Banda Raya', 'Jaya Baru', 'Kuta Raja'] },
    ],
  },
  {
    name: 'Jambi',
    cities: [
      { name: 'Kota Jambi', postalCode: '36111', districts: ['Pasar Jambi', 'Telanaipura', 'Jambi Selatan', 'Jambi Timur', 'Danau Teluk', 'Pelayangan', 'Jelutung', 'Kota Baru'] },
    ],
  },
  {
    name: 'Bengkulu',
    cities: [
      { name: 'Kota Bengkulu', postalCode: '38111', districts: ['Ratu Agung', 'Ratu Samban', 'Gading Cempaka', 'Teluk Segara', 'Muara Bangka Hulu', 'Selebar', 'Kampung Melayu', 'Sungai Serut', 'Singaran Pati'] },
    ],
  },
  {
    name: 'Bangka Belitung',
    cities: [
      { name: 'Kota Pangkalpinang', postalCode: '33111', districts: ['Rangkui', 'Bukit Intan', 'Taman Sari', 'Gerunggang', 'Pangkal Balam', 'Gabek', 'Girimaya'] },
    ],
  },
  {
    name: 'Kalimantan Tengah',
    cities: [
      { name: 'Kota Palangka Raya', postalCode: '73111', districts: ['Pahandut', 'Jekan Raya', 'Bukit Batu', 'Sebangau', 'Rakumpit'] },
    ],
  },
  {
    name: 'Kalimantan Utara',
    cities: [
      { name: 'Kota Tarakan', postalCode: '77111', districts: ['Tarakan Barat', 'Tarakan Tengah', 'Tarakan Timur', 'Tarakan Utara'] },
    ],
  },
  {
    name: 'Sulawesi Tengah',
    cities: [
      { name: 'Kota Palu', postalCode: '94111', districts: ['Palu Barat', 'Palu Timur', 'Palu Selatan', 'Palu Utara', 'Ulujadi', 'Tatanga', 'Mantikulore', 'Tawaeli'] },
    ],
  },
  {
    name: 'Sulawesi Tenggara',
    cities: [
      { name: 'Kota Kendari', postalCode: '93111', districts: ['Kendari', 'Kendari Barat', 'Mandonga', 'Baruga', 'Poasia', 'Abeli', 'Wua-Wua', 'Kadia', 'Puuwatu', 'Nambo'] },
    ],
  },
  {
    name: 'Gorontalo',
    cities: [
      { name: 'Kota Gorontalo', postalCode: '96111', districts: ['Kota Selatan', 'Kota Utara', 'Kota Barat', 'Kota Timur', 'Kota Tengah', 'Dungingi', 'Dumbo Raya', 'Hulonthalangi', 'Sipatana'] },
    ],
  },
  {
    name: 'Sulawesi Barat',
    cities: [
      { name: 'Kabupaten Mamuju', postalCode: '91511', districts: ['Mamuju', 'Simboro', 'Tapalang', 'Kalukku'] },
    ],
  },
  {
    name: 'Maluku',
    cities: [
      { name: 'Kota Ambon', postalCode: '97111', districts: ['Nusaniwe', 'Sirimau', 'Baguala', 'Teluk Ambon', 'Leitimur Selatan'] },
    ],
  },
  {
    name: 'Maluku Utara',
    cities: [
      { name: 'Kota Ternate', postalCode: '97711', districts: ['Ternate Tengah', 'Ternate Selatan', 'Ternate Utara', 'Pulau Ternate'] },
    ],
  },
  {
    name: 'Papua Barat',
    cities: [
      { name: 'Kabupaten Manokwari', postalCode: '98311', districts: ['Manokwari Barat', 'Manokwari Timur', 'Manokwari Selatan', 'Manokwari Utara'] },
    ],
  },
  {
    name: 'Papua Barat Daya',
    cities: [
      { name: 'Kota Sorong', postalCode: '98411', districts: ['Sorong', 'Sorong Barat', 'Sorong Timur', 'Sorong Utara', 'Sorong Kota', 'Sorong Manoi', 'Sorong Kepulauan', 'Klaurung', 'Malaimsimsa', 'Maladum Mes'] },
    ],
  },
]
