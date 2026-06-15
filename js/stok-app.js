new Vue({
  el: '#stok-app',
  data() {
    const sourceData = window.app || { stok: [], upbjjList: [], kategoriList: [] };

    let initialStok = [];
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('sitta_stock');
      if (saved) {
        try {
          initialStok = JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved stock, using defaults", e);
        }
      }
    }
    
    if (!initialStok || initialStok.length === 0) {
      initialStok = JSON.parse(JSON.stringify(sourceData.stok || []));
    }

    return {
      stok: initialStok,
      upbjjList: sourceData.upbjjList || [],
      kategoriList: sourceData.kategoriList || [],
      selectedUpbjj: '',
      selectedKategori: '',
      showWarningOnly: false,
      sortBy: 'judul',
      sortOrder: 'asc',
      showModal: false,
      modalType: 'add',
      editIndex: -1,
      form: {
        kode: '',
        judul: '',
        kategori: '',
        upbjj: '',
        lokasiRak: '',
        harga: 0,
        qty: 0,
        safety: 0,
        catatanHTML: ''
      },
      errors: {},
      showTooltip: false,
      alertActive: false,
      alertTitle: '',
      alertMessage: '',
      alertType: 'success',
      alertCallback: null
    };
  },
  computed: {
    filteredAndSortedStok() {
      let result = [...this.stok];

      if (this.selectedUpbjj) {
        result = result.filter(item => item.upbjj === this.selectedUpbjj);
      }

      if (this.selectedKategori) {
        result = result.filter(item => item.kategori === this.selectedKategori);
      }

      if (this.showWarningOnly) {
        result = result.filter(item => item.qty < item.safety || item.qty === 0);
      }

      result.sort((a, b) => {
        let valA = a[this.sortBy];
        let valB = b[this.sortBy];

        if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (valA < valB) return this.sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      return result;
    }
  },
  watch: {
    selectedUpbjj(newVal, oldVal) {
      console.log(`Filter UT-Daerah changed from "${oldVal}" to "${newVal}".`);
      if (!newVal) {
        this.selectedKategori = '';
      }
    },

    selectedKategori(newVal, oldVal) {
      console.log(`Filter Kategori changed from "${oldVal}" to "${newVal}".`);
    },

    stok: {
      deep: true,
      handler(newVal) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('sitta_stock', JSON.stringify(newVal));
        }
      }
    }
  },
  methods: {
    resetFilters() {
      this.selectedUpbjj = '';
      this.selectedKategori = '';
      this.showWarningOnly = false;
      this.sortBy = 'judul';
      this.sortOrder = 'asc';
    },

    getStockStatus(item) {
      if (item.qty === 0) {
        return { text: 'Kosong', class: 'status-kosong', icon: '🔴' };
      } else if (item.qty < item.safety) {
        return { text: 'Menipis', class: 'status-menipis', icon: '🟡' };
      } else {
        return { text: 'Aman', class: 'status-aman', icon: '🟢' };
      }
    },

    openAddModal() {
      this.modalType = 'add';
      this.editIndex = -1;
      this.form = {
        kode: '',
        judul: '',
        kategori: '',
        upbjj: '',
        lokasiRak: '',
        harga: 0,
        qty: 0,
        safety: 0,
        catatanHTML: ''
      };
      this.errors = {};
      this.showModal = true;
    },

    openEditModal(item) {
      this.modalType = 'edit';
      this.editIndex = this.stok.findIndex(s => s.kode === item.kode);
      this.form = { ...item };
      this.errors = {};
      this.showModal = true;
    },

    validateForm() {
      const errs = {};
      
      if (!this.form.kode || this.form.kode.trim() === '') {
        errs.kode = 'Kode mata kuliah wajib diisi';
      } else if (!/^[A-Z]{4,5}\d{4}$/.test(this.form.kode.trim())) {
        errs.kode = 'Format kode tidak valid (contoh: EKMA4116)';
      } else if (this.modalType === 'add' && this.stok.some(s => s.kode === this.form.kode.trim())) {
        errs.kode = 'Kode mata kuliah sudah terdaftar';
      }

      if (!this.form.judul || this.form.judul.trim() === '') {
        errs.judul = 'Nama / Judul mata kuliah wajib diisi';
      }

      if (!this.form.kategori) {
        errs.kategori = 'Kategori wajib dipilih';
      }

      if (!this.form.upbjj) {
        errs.upbjj = 'UT-Daerah wajib dipilih';
      }

      if (!this.form.lokasiRak || this.form.lokasiRak.trim() === '') {
        errs.lokasiRak = 'Lokasi rak wajib diisi';
      }

      if (this.form.harga === undefined || this.form.harga === null || this.form.harga < 0) {
        errs.harga = 'Harga harus >= 0';
      }

      if (this.form.qty === undefined || this.form.qty === null || this.form.qty < 0) {
        errs.qty = 'Stok harus >= 0';
      }

      if (this.form.safety === undefined || this.form.safety === null || this.form.safety < 0) {
        errs.safety = 'Safety stok harus >= 0';
      }

      this.errors = errs;
      return Object.keys(errs).length === 0;
    },

    submitForm() {
      if (!this.validateForm()) {
        return;
      }

      const itemData = {
        kode: this.form.kode.trim(),
        judul: this.form.judul.trim(),
        kategori: this.form.kategori,
        upbjj: this.form.upbjj,
        lokasiRak: this.form.lokasiRak.trim(),
        harga: Number(this.form.harga),
        qty: Number(this.form.qty),
        safety: Number(this.form.safety),
        catatanHTML: this.form.catatanHTML.trim()
      };

      if (this.modalType === 'add') {
        this.stok.push(itemData);
      } else {
        Vue.set(this.stok, this.editIndex, itemData);
      }

      this.showModal = false;
      this.triggerAlert(
        'Berhasil',
        this.modalType === 'add' ? 'Data stok bahan ajar berhasil ditambahkan!' : 'Data stok bahan ajar berhasil diperbarui!',
        'success'
      );
    },

    deleteItem(kode) {
      this.triggerAlert(
        'Konfirmasi Hapus',
        `Apakah Anda yakin ingin menghapus data dengan kode ${kode}?`,
        'confirm',
        (confirmed) => {
          if (confirmed) {
            this.stok = this.stok.filter(s => s.kode !== kode);
            this.triggerAlert('Berhasil', 'Data berhasil dihapus.', 'success');
          }
        }
      );
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

    toggleSort(field) {
      if (this.sortBy === field) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortBy = field;
        this.sortOrder = 'asc';
      }
    },

    formatRupiah(value) {
      if (!value && value !== 0) return 'Rp 0';
      return 'Rp ' + Number(value).toLocaleString('id-ID');
    }
  }
});
