# Update Fitur Tooltip pada Kolom Stok (Safety)

## Deskripsi Singkat
Pembaruan ini menambahkan fitur *tooltip* (keterangan tambahan saat *hover*) pada *header* tabel **"Stok (Safety)"**. Fitur ini bertujuan untuk memberikan konteks dan penjelasan kepada pengguna mengenai arti dari dua nilai angka yang ditampilkan di dalam kolom tersebut.

## Detail Perubahan

### 1. Perubahan pada View (`stock.html`)
Menambahkan _event listener_ Vue.js dan elemen antarmuka (UI) untuk *tooltip* di dalam tag `<th>` kolom stok.

* **Penambahan Event**: Menggunakan `@mouseenter` dan `@mouseleave` untuk mendeteksi kursor pengguna dan mengubah status visibilitas *tooltip*.
* **Elemen Tooltip**: Menambahkan sebuah `<div>` *pop-up* absolut di bawah teks *header* yang dikontrol menggunakan *directive* `v-show`.
* **Styling**: *Tooltip* menggunakan gaya bawaan (*inline style*) dengan latar belakang gelap (`#334155`), sudut membulat (*rounded*), dan sedikit efek bayangan (*shadow*) agar mudah dibaca dan menonjol.

**Cuplikan Kode:**
```html
<th
  @click="toggleSort('qty')"
  class="sortable text-right"
  @mouseenter="showTooltip = true"
  @mouseleave="showTooltip = false"
>
  Stok (Safety)
  <div v-show="showTooltip" style="/* ... inline styles ... */">
    <span v-text="tooltipText"></span>
  </div>
</th>
```

### 2. Perubahan pada Script js/stok-app.js

Menambahkan state `showTooltip` untuk mengontrol visibilitas *tooltip* dan `tooltipText` untuk menyimpan teks yang akan ditampilkan di dalam *tooltip*.

```javascript
data(){
  return {
    // ... data lainnya ...
    tooltipText: "Nilai di kiri adalah stok real, dan nilai di kanan adalah safety stok",
    showTooltip: false,
  }
}
``` 