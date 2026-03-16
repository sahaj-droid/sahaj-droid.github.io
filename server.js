const express = require('express');
const cors = require('cors');
const https = require('https');
const zlib = require('zlib');

const app = express();
app.use(cors());

const SYMBOL_MAP = {
  // ── Indices ──────────────────────────────────────────────
  nifty50:'^NSEI', banknifty:'^NSEBANK', sensex:'^BSESN', bankex:'^BSEBANKEX',
  finnifty:'NIFTY_FIN_SERVICE.NS', midcap:'^NSEMDCP50', smallcap:'NIFTYSMLCAP250.NS',
  niftyit:'^CNXIT', niftypharma:'^CNXPHARMA', niftyauto:'^CNXAUTO',
  niftymetal:'^CNXMETAL', niftyfmcg:'^CNXFMCG', niftyrealty:'^CNXREALTY',
  niftyenergy:'^CNXENERGY', niftyinfra:'^CNXINFRA', niftypse:'^CNXPSE',
  nifty100:'^CNX100', niftynext50:'^NSMIDCP', niftymidcap150:'NIFTYMIDCAP150.NS',
  niftysmallcap100:'NIFTYSMLCAP100.NS', niftymedia:'^CNXMEDIA',
  niftyconsumer:'^CNXCONSUM', niftyoil:'^CNXOILGAS',
  niftydefence:'NIFTYDEFENCE.NS', niftypvtbank:'NIFTYPVTBANK.NS',
  niftypsubank:'^CNXPSUBANK', niftymnc:'^CNXMNC',
  sensex50:'BSE-SENSEX50.BO', bse100:'BSE-100.BO', bse200:'BSE-200.BO',
  bse500:'BSE-500.BO', bsemidcap:'BSE-MID-CAP.BO', bsesmallcap:'BSE-SMLCAP.BO',

  // ── User Custom Stocks ───────────────────────────────────
  reltd: 'RELTD.NS',
  iciciamc: 'ICICIAMC.NS',
  olectra: 'OLECTRA.NS',
  kaynes: 'KAYNES.NS',
  baluforge: 'BALUFORGE.NS',
  subros: 'SUBROS.NS',
  pwl: 'PWL.NS',
  garuda: 'GARUDA.NS',
  jwl: 'JWL.NS',
  tennind: 'TENNIND.NS',
  lemontree: 'LEMONTREE.NS',
  shardacrop: 'SHARDACROP.NS',
  bse: 'BSE.NS',
  groww: 'GROWW.NS',
  transraill: 'TRANSRAILL.NS',
  hblengine: 'HBLENGINE.NS',
  taril: 'TARIL.BO',
  shaktipump: 'SHAKTIPUMP.NS',
  waareeener: 'WAAREEENER.NS',
  remsonsind: 'REMSONSIND.NS',
  suryarosni: 'SURYAROSNI.NS',
  vikran: 'VIKRAN.NS',
  adaniensol: 'ADANIENSOL.NS',
  adanipower: 'ADANIPOWER.NS',
  ambujacem: 'AMBUJACEM.NS',
  trident: 'TRIDENT.NS',
  kprmill: 'KPRMILL.NS',
  adanient: 'ADANIENT.NS',
  adaniports: 'ADANIPORTS.NS',
  krn: 'KRN.NS',
  lgeindia: 'LGEINDIA.NS',
  vedl: 'VEDL.NS',
  cpplus: 'CPPLUS.NS',
  eternal: 'ETERNAL.NS',
  stylamind: 'STYLAMIND.NS',
  sbin: 'SBIN.NS',
  reliance: 'RELIANCE.NS',
  texrail: 'TEXRAIL.NS',
  waareertl: 'WAAREERTL.BO',
  yatharth: 'YATHARTH.NS',
  jindrill: 'JINDRILL.NS',
  sandhar: 'SANDHAR.NS',
  premexpln: 'PREMEXPLN.NS',
  intlconv: 'INTLCONV.NS',
  denta: 'DENTA.NS',
  bhagyangr: 'BHAGYANGR.BO',
  chennpetro: 'CHENNPETRO.NS',
  hfcl: 'HFCL.NS',
  tbz: 'TBZ.NS',
  nmdc: 'NMDC.NS',
  ellen: 'ELLEN.NS',
  tdpowersys: 'TDPOWERSYS.NS',
  lloydsengg: 'LLOYDSENGG.BO',
  maithanall: 'MAITHANALL.BO',
  iex: 'IEX.NS',
  bancoindia: 'BANCOINDIA.NS',
  recltd: 'RECLTD.NS',
  jsll: 'JSLL.NS',
  shilpamed: 'SHILPAMED.NS',
  tatacap: 'TATACAP.NS',
  ace: 'ACE.NS',
  meesho: 'MEESHO.BO',
  goldbees: 'GOLDBEES.NS',
  goldetf: 'GOLDETF.NS',
  aci: 'ACI.NS',
  natcopharm: 'NATCOPHARM.NS',
  urbanco: 'URBANCO.NS',
  acmesolar: 'ACMESOLAR.NS',
  lauruslabs: 'LAURUSLABS.NS',
  nsdl: 'NSDL.BO',
  acc: 'ACC.NS',
  southwest: 'SOUTHWEST.BO',
  igil: 'IGIL.NS',
  gmdcltd: 'GMDCLTD.NS',
  tmcv: 'TMCV.BO',
  acgl: 'ACGL.BO',
  tmpv: 'TMPV.NS',
  unimech: 'UNIMECH.NS',
  stovekraft: 'STOVEKRAFT.NS',
  syrma: 'SYRMA.NS',
  studds: 'STUDDS.NS',
  chemcon: 'CHEMCON.NS',
  lenskart: 'LENSKART.NS',
  heg: 'HEG.BO',
  tajgvk: 'TAJGVK.NS',
  indotech: 'INDOTECH.NS',
  mosmall250: 'MOSMALL250.NS',
  ashokley: 'ASHOKLEY.NS',
  chalet: 'CHALET.NS',
  mahepc: 'MAHEPC.NS',
  elecon: 'ELECON.NS',
  hdbfs: 'HDBFS.NS',
  vikramsolr: 'VIKRAMSOLR.NS',
  greavescot: 'GREAVESCOT.NS',
  hondapower: 'HONDAPOWER.NS',
  globecivil: 'GLOBECIVIL.NS',
  arvsmart: 'ARVSMART.NS',
  sci: 'SCI.NS',
  moschip: 'MOSCHIP.NS',
  veljan: 'VELJAN.BO',
  micel: 'MICEL.BO',
  shaily: 'SHAILY.NS',
  ipl: 'IPL.NS',
  mazda: 'MAZDA.NS',
  bodalchem: 'BODALCHEM.NS',
  genuspower: 'GENUSPOWER.NS',
  smallcap: 'SMALLCAP.NS',
  eiel: 'EIEL.NS',
  gujaratpoly: 'GUJARATPOLY.BO',
  mkexim: 'MKEXIM.BO',
  rohltd: 'ROHLTD.NS',
  ratnaveer: 'RATNAVEER.NS',
  omaxauto: 'OMAXAUTO.BO',
  tatasteel: 'TATASTEEL.BO',
  meil: 'MEIL.NS',
  atulauto: 'ATULAUTO.NS',
  basilic: 'BASILIC.NS',
  inoxindia: 'INOXINDIA.NS',
  bluejet: 'BLUEJET.BO',
  patanjali: 'PATANJALI.NS',
  powermech: 'POWERMECH.NS',
  motherson: 'MOTHERSON.BO',
  hdfcamc: 'HDFCAMC.NS',
  jswcement: 'JSWCEMENT.BO',
  hdfcbank: 'HDFCBANK.BO',
  paisalo: 'PAISALO.BO',
  cupid: 'CUPID.BO',
  igarashi: 'IGARASHI.NS',
  supriya: 'SUPRIYA.NS',
  kirlosbros: 'KIRLOSBROS.NS',
  bondada: 'BONDADA.BO',
  nile: 'NILE.BO',
  veto: 'VETO.NS',
  zentec: 'ZENTEC.NS',
  kpigreen: 'KPIGREEN.BO',
  simmond: 'SIMMOND.BO',
  technoe: 'TECHNOE.NS',
  icicibank: 'ICICIBANK.NS',
  imagicaa: 'IMAGICAA.NS',
  bluestarco: 'BLUESTARCO.NS',
  datapattns: 'DATAPATTNS.NS',
  schneider: 'SCHNEIDER.BO',
  castrolind: 'CASTROLIND.NS',
  avantel: 'AVANTEL.NS',
  polyplex: 'POLYPLEX.NS',
  sailife: 'SAILIFE.NS',
  sail: 'SAIL.NS',
  hyundai: 'HYUNDAI.NS',
  rtnindia: 'RTNINDIA.BO',
  jbma: 'JBMA.NS',
  alembicltd: 'ALEMBICLTD.NS',
  univastu: 'UNIVASTU.NS',
  aeroenter: 'AEROENTER.NS',
  mrpl: 'MRPL.NS',
  refex: 'REFEX.NS',
  indofarm: 'INDOFARM.BO',
  multibase: 'MULTIBASE.BO',
  madrasfert: 'MADRASFERT.NS',
  greenply: 'GREENPLY.NS',
  hscl: 'HSCL.NS',
  bajfinance: 'BAJFINANCE.NS',
  mircelectr: 'MIRCELECTR.BO',
  bpl: 'BPL.BO',
  suzlon: 'SUZLON.NS',
  zensartech: 'ZENSARTECH.NS',
  ircon: 'IRCON.NS',
  silverbees: 'SILVERBEES.NS',
  varroc: 'VARROC.NS',
  indusindbk: 'INDUSINDBK.BO',
  integraen: 'INTEGRAEN.BO',
  jindworld: 'JINDWORLD.NS',
  olaelec: 'OLAELEC.BO',
  kecl: 'KECL.NS',
  electcast: 'ELECTCAST.NS',
  paytm: 'PAYTM.NS',
  titan: 'TITAN.NS',
  anthem: 'ANTHEM.NS',
  transworld: 'TRANSWORLD.NS',
  jktyre: 'JKTYRE.NS',
  infy: 'INFY.NS',
  moil: 'MOIL.NS',
  sudarschem: 'SUDARSCHEM.NS',
  forcemot: 'FORCEMOT.NS',
  godfryphlp: 'GODFRYPHLP.NS',
  itc: 'ITC.NS',
  ekc: 'EKC.NS',
  tcs: 'TCS.BO',
  dcmsrind: 'DCMSRIND.NS',
  atgl: 'ATGL.NS',
  rategain: 'RATEGAIN.NS',
  kec: 'KEC.NS',
  tanaa: 'TANAA.BO',
  jiofin: 'JIOFIN.NS',
  exhicon: 'EXHICON.BO',
  shreeosfm: 'SHREEOSFM.NS',
  20microns: '20MICRONS.BO',
  mishtann: 'MISHTANN.BO',
  mhlxmiru: 'MHLXMIRU.BO',
  goodricke: 'GOODRICKE.BO',
  stardelta: 'STARDELTA.BO',
  jtlind: 'JTLIND.NS',
  pancarbon: 'PANCARBON.BO',
  rexnord: 'REXNORD.BO',
  somiconvey: 'SOMICONVEY.NS',
  pixtrans: 'PIXTRANS.NS',
  globoffs: 'GLOBOFFS.BO',
  swissmltry: 'SWISSMLTRY.BO',
  rdbrl: 'RDBRL.BO',
  chamblfert: 'CHAMBLFERT.NS',
  mmfl: 'MMFL.NS',
  cewater: 'CEWATER.NS',
  vmm: 'VMM.NS',
  scilal: 'SCILAL.BO',
  irctc: 'IRCTC.NS',
  heranba: 'HERANBA.NS',
  nbcc: 'NBCC.NS',
  heromotoco: 'HEROMOTOCO.NS',
  idea: 'IDEA.NS',
  ifci: 'IFCI.NS',
  lici: 'LICI.BO',
  hindzinc: 'HINDZINC.NS',
  hindcopper: 'HINDCOPPER.NS',
  hindalco: 'HINDALCO.BO',
  hindoilexp: 'HINDOILEXP.NS',
  nationalum: 'NATIONALUM.NS',
  swsolar: 'SWSOLAR.NS',
  efcil: 'EFCIL.BO',
  ireda: 'IREDA.NS',
  bajaj_auto: 'BAJAJ-AUTO.BO',
  bajajhcare: 'BAJAJHCARE.NS',
  symphony: 'SYMPHONY.NS',
  iolcp: 'IOLCP.NS',
  shilgravq: 'SHILGRAVQ.BO',
  tejasnet: 'TEJASNET.BO',
  jkpaper: 'JKPAPER.BO',
  ucobank: 'UCOBANK.BO',
  stallion: 'STALLION.BO',
  styrenix: 'STYRENIX.NS',
  mcel: 'MCEL.BO',
  lichsgfin: 'LICHSGFIN.BO',
  pfc: 'PFC.BO',
  zaggle: 'ZAGGLE.NS',
  kirlpnu: 'KIRLPNU.NS',
  isgec: 'ISGEC.NS',
  gna: 'GNA.NS',
  donear: 'DONEAR.NS',
  belrise: 'BELRISE.NS',
  tatainvest: 'TATAINVEST.BO',
  pgfoilq: 'PGFOILQ.BO',
  aeroflex: 'AEROFLEX.NS',
  adanigreen: 'ADANIGREEN.BO',
  smlmah: 'SMLMAH.BO',
  elprointl: 'ELPROINTL.BO',
  cninfotech: 'CNINFOTECH.BO',
  geship: 'GESHIP.NS',
  renuka: 'RENUKA.BO',
  irb: 'IRB.NS',
  morepenlab: 'MOREPENLAB.NS',
  nhpc: 'NHPC.NS',
  idfcfirstb: 'IDFCFIRSTB.BO',
  idbi: 'IDBI.NS',
  shrirampps: 'SHRIRAMPPS.NS',
  sjvn: 'SJVN.NS',
  dolatalgo: 'DOLATALGO.NS',
  ntpcgreen: 'NTPCGREEN.NS',
  canbk: 'CANBK.NS',
  bajajhfl: 'BAJAJHFL.BO',
  yesbank: 'YESBANK.NS',
  irfc: 'IRFC.NS',
  zeel: 'ZEEL.NS',
  ioc: 'IOC.NS',
  gppl: 'GPPL.NS',
  mufti: 'MUFTI.NS',
  vprpl: 'VPRPL.NS',
  inoxwind: 'INOXWIND.BO',
  arisinfra: 'ARISINFRA.NS',
  gail: 'GAIL.NS',
  exicom: 'EXICOM.NS',
  lxchem: 'LXCHEM.NS',
  balmlawrie: 'BALMLAWRIE.NS',
  ikio: 'IKIO.NS',
  vipulorg: 'VIPULORG.BO',
  enginersin: 'ENGINERSIN.NS',
  bankbaroda: 'BANKBARODA.NS',
  ongc: 'ONGC.NS',
  bhel: 'BHEL.NS',
  dcxindia: 'DCXINDIA.NS',
  sanghvimov: 'SANGHVIMOV.NS',
  uds: 'UDS.NS',
  jswinfra: 'JSWINFRA.NS',
  iti: 'ITI.NS',
  ntpc: 'NTPC.NS',
  exideind: 'EXIDEIND.NS',
  coalindia: 'COALINDIA.NS',
  rvnl: 'RVNL.NS',
  tatapower: 'TATAPOWER.NS',
  bel: 'BEL.NS',
  pcbl: 'PCBL.NS',
  wpil: 'WPIL.BO',
  dlinkindia: 'DLINKINDIA.NS',
  hpl: 'HPL.NS',
  akums: 'AKUMS.NS',
  triturbine: 'TRITURBINE.NS',
  emslimited: 'EMSLIMITED.NS',
  dharmaj: 'DHARMAJ.BO',
  genesys: 'GENESYS.NS',
  wonderla: 'WONDERLA.NS',
  tanla: 'TANLA.NS',
  tatatech: 'TATATECH.NS',
  asahiindia: 'ASAHIINDIA.NS',
  highene: 'HIGHENE.BO',
  jklakshmi: 'JKLAKSHMI.NS',
  welcorp: 'WELCORP.NS',
  titagarh: 'TITAGARH.NS',
  are_m: 'ARE&M.NS',
  liquidbees: 'LIQUIDBEES.NS',
  premierene: 'PREMIERENE.NS',
  voltas: 'VOLTAS.NS',
  paras: 'PARAS.NS',
  mtartech: 'MTARTECH.NS',
  cdsl: 'CDSL.NS',
  cochinship: 'COCHINSHIP.BO',
  anup: 'ANUP.NS',
  grse: 'GRSE.NS',
  mazdock: 'MAZDOCK.NS',
  siemens: 'SIEMENS.NS',
  mafatind: 'MAFATIND.BO',
  lt: 'LT.NS',
  dmart: 'DMART.NS',
  zuari: 'ZUARI.BO',
  hal: 'HAL.NS',
  abb: 'ABB.NS',
  aparinds: 'APARINDS.NS',
  voltamp: 'VOLTAMP.NS',

  // ── Standard Large Cap / Nifty 50 ────────────────────────
  reliance:'RELIANCE.NS', tcs_nse:'TCS.NS', hdfcbank_n:'HDFCBANK.NS',
  infy:'INFY.NS', icicibank:'ICICIBANK.NS', hindunilvr:'HINDUNILVR.NS',
  bajfinance:'BAJFINANCE.NS', sbin:'SBIN.NS', axisbank:'AXISBANK.NS',
  kotakbank:'KOTAKBANK.NS', lt_nse:'LT.NS', hcltech:'HCLTECH.NS',
  wipro:'WIPRO.NS', asianpaint:'ASIANPAINT.NS', maruti:'MARUTI.NS',
  bajajfinsv:'BAJAJFINSV.NS', titan:'TITAN.NS', sunpharma:'SUNPHARMA.NS',
  tatasteel_n:'TATASTEEL.NS', ntpc:'NTPC.NS', powergrid:'POWERGRID.NS',
  ongc:'ONGC.NS', coalindia:'COALINDIA.NS', jswsteel:'JSWSTEEL.NS',
  tatamotors:'TATAMOTORS.NS', ultracemco:'ULTRACEMCO.NS',
  adaniports_n:'ADANIPORTS.NS', adanient_n:'ADANIENT.NS', grasim:'GRASIM.NS',
  indusindbk_n:'INDUSINDBK.NS', drreddy:'DRREDDY.NS', cipla:'CIPLA.NS',
  hdfclife:'HDFCLIFE.NS', sbilife:'SBILIFE.NS', techm:'TECHM.NS',
  nestleind:'NESTLEIND.NS', britannia:'BRITANNIA.NS',
  heromotoco_n:'HEROMOTOCO.NS', eichermot:'EICHERMOT.NS',
  bajaj_auto:'BAJAJ-AUTO.NS', apollohosp:'APOLLOHOSP.NS', trent:'TRENT.NS',
  hindalco_n:'HINDALCO.NS', bpcl:'BPCL.NS', ioc:'IOC.NS',
  hindpetro:'HINDPETRO.NS', gail_n:'GAIL.NS', shreecem:'SHREECEM.NS',
  acc_n:'ACC.NS',
  pnb:'PNB.NS', bankbaroda:'BANKBARODA.NS', canbk_n:'CANBK.NS',
  unionbank:'UNIONBANK.NS', idfcfirstb_n:'IDFCFIRSTB.NS', federalbnk:'FEDERALBNK.NS',
  rblbank:'RBLBANK.NS', aubank:'AUBANK.NS', idbi:'IDBI.NS',
  ucobank_n:'UCOBANK.NS', mahabank:'MAHABANK.NS',
  cholafin:'CHOLAFIN.NS', muthootfin:'MUTHOOTFIN.NS', manappuram:'MANAPPURAM.NS',
  hdfcamc_n:'HDFCAMC.NS', angelone:'ANGELONE.NS', icicigi:'ICICIGI.NS',
  lici:'LICI.NS', jiofin:'JIOFIN.NS', cdsl_n:'CDSL.NS', bse_stock:'BSE.NS',
  crisil:'CRISIL.NS', '360one':'360ONE.NS', iex_n:'IEX.NS',
  shrirampps:'SHRIRAMPPS.NS', sundarmfin:'SUNDARMFIN.NS', tatacap:'TATACAP.NS',
  ltim:'LTIM.NS', mphasis:'MPHASIS.NS', persistent:'PERSISTENT.NS',
  coforge:'COFORGE.NS', kpittech_n:'KPITTECH.NS', naukri:'NAUKRI.NS',
  tataelxsi:'TATAELXSI.NS', cyient:'CYIENT.NS', zomato:'ZOMATO.NS', nykaa:'NYKAA.NS',
  divislab:'DIVISLAB.NS', auropharma:'AUROPHARMA.NS', lupin:'LUPIN.NS',
  torntpharm:'TORNTPHARM.NS', alkem:'ALKEM.NS', ipcalab:'IPCALAB.NS', maxhealth:'MAXHEALTH.NS',
  tvsmotor:'TVSMOTOR.NS', mahindra:'M&M.NS', motherson_n:'MOTHERSON.NS',
  mrf:'MRF.NS', apollotyre:'APOLLOTYRE.NS', ceatltd:'CEATLTD.NS',
  balkrisind:'BALKRISIND.NS', boschltd:'BOSCHLTD.NS',
  dabur:'DABUR.NS', marico:'MARICO.NS', colpal:'COLPAL.NS', vbl:'VBL.NS',
  tataconsum:'TATACONSUM.NS', godrejcp:'GODREJCP.NS', dmart_n:'DMART.NS',
  pidilitind:'PIDILITIND.NS', havells:'HAVELLS.NS', dixon:'DIXON.NS',
  adanigreen_n:'ADANIGREEN.NS', adanipower_n:'ADANIPOWER.NS', tatapower_n:'TATAPOWER.NS',
  torntpower:'TORNTPOWER.NS', igl:'IGL.NS', petronet:'PETRONET.NS',
  atgl:'ATGL.NS', oil_india:'OIL.NS',
  vedl_n:'VEDL.NS', hindzinc:'HINDZINC.NS', sail_n:'SAIL.NS',
  dlf:'DLF.NS', godrejprop:'GODREJPROP.NS', prestige:'PRESTIGE.NS',
  irctc_n:'IRCTC.NS', concor:'CONCOR.NS',
  hal_n:'HAL.NS', bhel_n:'BHEL.NS', mazdock_n:'MAZDOCK.NS',
  bhartiartl:'BHARTIARTL.NS', industower:'INDUSTOWER.NS', suntv:'SUNTV.NS', pvrinox:'PVRINOX.NS',
  srf:'SRF.NS', deepakntr:'DEEPAKNTR.NS', piind:'PIIND.NS', tatachem:'TATACHEM.NS',
  abb_n:'ABB.NS', siemens:'SIEMENS.NS',
};

function fetchYahoo(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'query1.finance.yahoo.com',
      path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://finance.yahoo.com',
        'Referer': 'https://finance.yahoo.com/',
      }
    };

    const req = https.request(options, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const enc = (res.headers['content-encoding'] || '').toLowerCase();
        function parse(text) {
          try { resolve(JSON.parse(text)); }
          catch(e) { reject(new Error('Parse error: ' + text.slice(0,200))); }
        }
        if (enc.includes('br')) {
          zlib.brotliDecompress(buf, (err, d) => err ? reject(err) : parse(d.toString()));
        } else if (enc.includes('gzip')) {
          zlib.gunzip(buf, (err, d) => err ? reject(err) : parse(d.toString()));
        } else if (enc.includes('deflate')) {
          zlib.inflate(buf, (err, d) => err ? reject(err) : parse(d.toString()));
        } else {
          parse(buf.toString());
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

// ── /quotes — use v8/chart with interval=1d to get current price + meta
// Chart API works, v7/quote API blocks. So we fetch each symbol via chart API.
app.get('/quotes', async (req, res) => {
  try {
    const ids = (req.query.ids||'').split(',').filter(Boolean);
    if (!ids.length) return res.json([]);

    // Fetch all in parallel using chart API (which works!)
    const results = await Promise.all(ids.map(async id => {
      try {
        const sym = encodeURIComponent(SYMBOL_MAP[id]||id);
        const path = `/v8/finance/chart/${sym}?range=5d&interval=1d&includePrePost=false&formatted=false`;
        const data = await fetchYahoo(path);
        const r = data?.chart?.result?.[0];
        if (!r) return {id, error:true};

        const meta = r.meta || {};
        const q = r.indicators?.quote?.[0] || {};
        const ts = r.timestamp || [];
        const lastIdx = ts.length - 1;

        // Get last close as current price
        const closes = q.close || [];
        const opens  = q.open  || [];
        const highs  = q.high  || [];
        const lows   = q.low   || [];
        const vols   = q.volume|| [];

        const price    = meta.regularMarketPrice || closes[lastIdx];
        const prevClose= meta.previousClose || meta.chartPreviousClose || closes[lastIdx-1];
        const change   = price && prevClose ? price - prevClose : null;
        const changePct= change && prevClose ? (change/prevClose)*100 : null;

        return {
          id,
          price,
          change,
          changePct,
          dayHigh:     meta.regularMarketDayHigh  || highs[lastIdx],
          dayLow:      meta.regularMarketDayLow   || lows[lastIdx],
          fiftyTwoWkH: meta.fiftyTwoWeekHigh,
          fiftyTwoWkL: meta.fiftyTwoWeekLow,
          prevClose,
          open:        meta.regularMarketOpen     || opens[lastIdx],
          volume:      meta.regularMarketVolume   || vols[lastIdx],
          mktCap:      meta.marketCap,
          pe:          null,
        };
      } catch(e) {
        console.error(`Error fetching ${id}:`, e.message);
        return {id, error:true};
      }
    }));

    res.json(results);
  } catch(e) {
    console.error('Quotes error:', e.message);
    res.status(500).json({error: e.message});
  }
});

// ── /chart — same working approach
app.get('/chart', async (req, res) => {
  try {
    const {id, range='1d', interval='15m'} = req.query;
    if (!id) return res.status(400).json({error:'id required'});
    const sym = SYMBOL_MAP[id]||id;
    const path = `/v8/finance/chart/${encodeURIComponent(sym)}?range=${range}&interval=${interval}&includePrePost=false&formatted=false`;
    const data = await fetchYahoo(path);
    const chart = data?.chart?.result?.[0];
    if (!chart) return res.status(404).json({error:'No data'});
    const ts = chart.timestamp||[];
    const q = chart.indicators?.quote?.[0]||{};
    const candles = ts.map((t,i)=>({
      t:t*1000, o:q.open?.[i], h:q.high?.[i],
      l:q.low?.[i], c:q.close?.[i], v:q.volume?.[i]
    })).filter(c=>c.o!=null&&c.c!=null);
    res.json({id, range, interval, candles});
  } catch(e) {
    console.error('Chart error:', e.message);
    res.status(500).json({error: e.message});
  }
});

// ── /search — Yahoo Finance autocomplete for any NSE/BSE stock
app.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 1) return res.json([]);

    // Try both NSE (.NS) and BSE (.BO) suffixed queries + plain symbol
    const queries = [q + '.NS', q + '.BO', q];
    const path = `/v1/finance/search?q=${encodeURIComponent(q)}&lang=en-US&region=IN&quotesCount=20&newsCount=0&listsCount=0&enableFuzzyQuery=false&enableCb=false&enableNavLinks=false&enableEnhancedTrivialQuery=true`;
    const data = await fetchYahoo(path);

    const quotes = data?.quotes || [];
    // Filter to Indian exchange stocks only (NSE/BSE)
    const indian = quotes.filter(q =>
      q.exchange === 'NSI' || q.exchange === 'BSE' ||
      (q.symbol && (q.symbol.endsWith('.NS') || q.symbol.endsWith('.BO')))
    );

    const results = indian.map(q => {
      const rawSym = q.symbol || '';
      // Generate a clean id from symbol
      const sym = rawSym.replace(/\.(NS|BO)$/, '');
      const exchange = rawSym.endsWith('.BO') ? 'BSE' : 'NSE';
      const id = (sym + (exchange === 'BSE' ? '_bse' : '')).toLowerCase().replace(/[^a-z0-9_]/g,'_');
      return {
        id,
        sym,
        name: q.longname || q.shortname || sym,
        sector: q.sector || '',
        exchange,
        yahooSym: rawSym,
      };
    });

    // Also add to SYMBOL_MAP dynamically so /quotes works
    results.forEach(r => {
      if (!SYMBOL_MAP[r.id]) SYMBOL_MAP[r.id] = r.yahooSym;
    });

    res.json(results);
  } catch(e) {
    console.error('Search error:', e.message);
    res.status(500).json({error: e.message});
  }
});


const PORT = process.env.PORT||3001;
app.listen(PORT, ()=>console.log(`Proxy v2.4 on port ${PORT}`));
