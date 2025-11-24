# Folder Size Analyzer (VS Code Extension)

Workspace klasör ve dosya boyutlarını hızlı, lazy ve renk kodlu gösterimle incelemek için.

## Özellikler (v1.2.0)

- Activity Bar paneli: "Folder Size" hiyerarşik görünüm (klasör + dosya)
- Lazy directory size hesaplama (expand edildiğinde hesaplanır)
- Otomatik başlangıç önbellekleme (konfigüre edilebilir hedef klasörler)
- Ignore glob pattern desteği (`folderSize.ignorePatterns`)
- Eşik bazlı renkler (uyarı / tehlike) badge renginde
- Badge gösterimi kapatılabilir (`folderSize.showBadges`)
- Dosya gösterimi kapatılabilir (`folderSize.showFiles`)
- Kopyalama, Explorer'da açma ve yeniden analiz komutları
- Concurrency limiti ayarlanabilir (`folderSize.concurrencyLimit`)

## Kurulum (VSIX)

```bash
code --install-extension packages/vscode-folder-size/vscode-folder-size-1.2.0.vsix
```

## Komutlar

| Komut | Açıklama |
|-------|----------|
| Folder Size: Analyze Workspace | Konfigüre edilen hedef klasörleri analiz eder |
| Folder Size: Copy Item Size | Seçili öğenin boyutunu panoya kopyalar |
| Folder Size: Open In Explorer | Öğe konumunu Explorer'da gösterir |
| Folder Size: Re-Analyze Current Node | Öğe için önbelleği temizleyip yeniden hesaplar |
| Refresh (view title) | Paneldeki görünümü/hesaplamayı yeniler |

Komut paletinden veya öğe sağ tık menüsünden (menü katkıları eklenebilir) tetiklenebilir.

## Ayarlar (settings.json)

```jsonc
{
  "folderSize.targetFolders": ["node_modules", "dist"], // önbellek için isteğe bağlı sınırlama
  "folderSize.ignorePatterns": ["**/.git", "**/.vscode", "**/node_modules/.cache"],
  "folderSize.showFiles": true,           // dosyaları göster
  "folderSize.showBadges": true,          // dekorasyon badge'i göster
  "folderSize.thresholds": {              // MB cinsinden renk eşikleri
    "warnMB": 50,
    "dangerMB": 200
  },
  "folderSize.concurrencyLimit": 8        // aynı anda maksimum FS işlemi
}
```

Renk mantığı:

- `>= dangerMB` → Tema rengi: errorForeground
- `>= warnMB` ve `< dangerMB` → warningForeground
- `< warnMB` → varsayılan (renk yok / tema tanımı)

## Kullanım Akışı

1. Aktivasyon sonrası paneli aç (Activity Bar'da "Folder Size").
2. Klasörleri genişlettikçe boyutlar hesaplanır ve cache'e alınır.
3. Boyut eşiği uyarıları badge rengiyle gözükür. Badge'i gizlemek için `showBadges = false` yap.
4. Boyutu kopyalamak için öğe seç ve komutu çalıştır.
5. Yeniden analiz için `Re-Analyze Current Node` komutunu kullan (cache temizlenir).

## Geliştirme

```bash
cd packages/vscode-folder-size
npm install
npm run package        # build
npx vsce package --no-dependencies  # VSIX üret
```

Hızlı test: VS Code içinde `F5` ile Extension Development Host aç (launch config eklenebilir).

## Yol Haritası (Sonraki Adımlar)

- İptal edilebilir analiz (AbortController entegrasyonu UI tarafı)
- Progress gösterimi (status bar veya panel üstü yüzdesel)
- Boyut filtreleri / arama kutusu
- Webview grafik (daire/pasta grafiği) kullanımı
- Cache kalıcılığı (workspace memento)
- Menü katkıları (tree item context menüsü) ve çoklu seçim işlemleri

## Lisans

İç kullanım (henüz yayınlanmadı). Gerektiğinde MIT eklenebilir.
