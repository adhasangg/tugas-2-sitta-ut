new Vue({
  el: '#tracking-app',
  data() {
    const sourceData = window.app || { paket: [], pengirimanList: [], tracking: {} };

    let initialTracking = {};
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('sitta_tracking');
      if (saved) {
        try {
          initialTracking = JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved tracking, using defaults", e);
        }
      }
    }

    if (!initialTracking || Object.keys(initialTracking).length === 0) {
      initialTracking = JSON.parse(JSON.stringify(sourceData.tracking || {}));
    }

    return {
      paketList: sourceData.paket || [],
      pengirimanList: sourceData.pengirimanList || [],
      trackingDb: initialTracking,
      searchDoNumber: '',
      searchedDoResult: null,
      searchPerformed: false,
      showAddDoModal: false,
      form: {
        nim: '',
        nama: '',
        ekspedisi: 'JNE Regular',
        paketKode: '',
        tanggalKirim: ''
      },
      errors: {},
      alertActive: false,
      alertTitle: '',
      alertMessage: '',
      alertType: 'success',
      alertCallback: null
    };
  },
  computed: {
    generatedDoNumber() {
      const year = new Date().getFullYear();
      const prefix = `DO${year}-`;
      
      const matchNumbers = Object.keys(this.trackingDb)
        .filter(key => key.toUpperCase().startsWith(prefix.toUpperCase()) || key.toUpperCase().startsWith(`DO2025-`))
        .map(key => {
          const parts = key.split('-');
          if (parts.length < 2) return 0;
          const seq = parseInt(parts[1], 10);
          return isNaN(seq) ? 0 : seq;
        });

      const nextSeq = matchNumbers.length > 0 ? Math.max(...matchNumbers) + 1 : 1;
      const seqStr = String(nextSeq).padStart(3, '0');
      return `${prefix}${seqStr}`;
    },

    selectedPaketDetails() {
      if (!this.form.paketKode) return null;
      return this.paketList.find(p => p.kode === this.form.paketKode);
    },

    formTotalHarga() {
      const p = this.selectedPaketDetails;
      return p ? p.harga : 0;
    }
  },
  watch: {
    trackingDb: {
      deep: true,
      handler(newVal) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('sitta_tracking', JSON.stringify(newVal));
        }
      }
    },
    searchDoNumber(newVal) {
      if (!newVal || newVal.trim() === '') {
        this.searchPerformed = false;
        this.searchedDoResult = null;
      }
    }
  },
  mounted() {
    this.setDefaultDate();
  },
  methods: {
    setDefaultDate() {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      this.form.tanggalKirim = `${yyyy}-${mm}-${dd}`;
    },

    performSearch() {
      const query = this.searchDoNumber.trim().toUpperCase();
      this.searchPerformed = true;
      
      if (!query) {
        this.searchedDoResult = null;
        return;
      }

      const normalizedQuery = query.replace('DO', '').replace('-', '');
      const queryNum = parseInt(normalizedQuery, 10);

      const foundKey = Object.keys(this.trackingDb).find(key => {
        if (key.toUpperCase() === query) return true;
        const normalizedKey = key.toUpperCase().replace('DO', '').replace('-', '');
        const keyNum = parseInt(normalizedKey, 10);
        return !isNaN(queryNum) && !isNaN(keyNum) && queryNum === keyNum;
      });

      if (foundKey) {
        this.searchedDoResult = {
          nomorDO: foundKey,
          ...this.trackingDb[foundKey]
        };
      } else {
        this.searchedDoResult = null;
      }
    },

    openAddDoModal() {
      this.form.nim = '';
      this.form.nama = '';
      this.form.ekspedisi = 'JNE Regular';
      this.form.paketKode = '';
      this.setDefaultDate();
      this.errors = {};
      this.showAddDoModal = true;
    },

    validateForm() {
      const errs = {};

      if (!this.form.nim || this.form.nim.trim() === '') {
        errs.nim = 'NIM mahasiswa wajib diisi';
      } else if (!/^\d+$/.test(this.form.nim.trim())) {
        errs.nim = 'NIM harus berupa angka saja';
      }

      if (!this.form.nama || this.form.nama.trim() === '') {
        errs.nama = 'Nama penerima wajib diisi';
      }

      if (!this.form.ekspedisi) {
        errs.ekspedisi = 'Metode ekspedisi wajib dipilih';
      }

      if (!this.form.paketKode) {
        errs.paketKode = 'Paket bahan ajar wajib dipilih';
      }

      if (!this.form.tanggalKirim) {
        errs.tanggalKirim = 'Tanggal kirim wajib diisi';
      }

      this.errors = errs;
      return Object.keys(errs).length === 0;
    },

    submitDO() {
      if (!this.validateForm()) {
        return;
      }

      const doNum = this.generatedDoNumber;
      const newDo = {
        nim: this.form.nim.trim(),
        nama: this.form.nama.trim(),
        status: 'Diproses (Baru)',
        ekspedisi: this.form.ekspedisi,
        tanggalKirim: this.form.tanggalKirim,
        paket: this.form.paketKode,
        total: this.formTotalHarga,
        perjalanan: [
          {
            waktu: new Date().toLocaleString('id-ID'),
            keterangan: `DO Dibuat. Pengirim: Universitas Terbuka. Penerima: ${this.form.nama.trim()}`
          }
        ]
      };

      Vue.set(this.trackingDb, doNum, newDo);

      this.showAddDoModal = false;

      this.searchDoNumber = doNum;
      this.performSearch();

      this.triggerAlert('Berhasil', `Delivery Order ${doNum} berhasil ditambahkan!`, 'success');
    },

    triggerAlert(title, message, type = 'success', callback = null) {
      this.alertActive = true;
      this.alertTitle = title;
      this.alertMessage = message;
      this.alertType = type;
      this.alertCallback = callback;
    },

    closeAlert(confirmed) {
      this.alertActive = false;
      if (this.alertCallback) {
        this.alertCallback(confirmed);
      }
    },

    formatRupiah(value) {
      if (!value && value !== 0) return 'Rp 0';
      return 'Rp ' + Number(value).toLocaleString('id-ID');
    }
  }
});
