/** Ödeme ConsentGate içinde gösterilen Mesafeli Satış Sözleşmesi metni */
export function DsaContent() {
  return (
    <>
      <p><strong>SATICI:</strong> Mettlo (mettlo.tr)<br /><strong>ALICI:</strong> Hesabınıza kayıtlı üye</p>

      <h4 style={{ marginTop: 16 }}>1. Sözleşmenin Konusu</h4>
      <p>Bu sözleşme; Mettlo platformu üzerinden seçilen koçluk abonelik planının uzaktan (internet) satışı ve dijital ifasına ilişkin tarafların hak ve yükümlülüklerini düzenler. Satışa konu abonelik planının adı, fiyatı ve ödeme periyodu ödeme ekranında belirtilir.</p>

      <h4 style={{ marginTop: 16 }}>2. Hizmetin Kapsamı</h4>
      <p>Abonelik planı kapsamında alıcı, ilgili koçun Mettlo platformundaki ücretli program, video, canlı ders, topluluk ve koçluk alanlarına abonelik süresi boyunca dijital erişim hakkı kazanır. Hizmet tamamen dijital niteliktedir.</p>

      <h4 style={{ marginTop: 16 }}>3. Ödeme Koşulları</h4>
      <p>Belirtilen abonelik bedeli, ödeme ekranında onaylanan kredi veya banka kartından tek seferlik tahsil edilir. Abonelik otomatik olarak yenilenmez; alıcı her dönem için ayrıca ödeme yapar.</p>

      <h4 style={{ marginTop: 16 }}>4. Teslimat</h4>
      <p>Dijital hizmet niteliğindeki abonelik, ödemenin iyzico tarafından onaylandığı andan itibaren anında ifaya başlanır ve alıcının hesabına erişim açılır.</p>

      <h4 style={{ marginTop: 16, color: '#c53030' }}>5. Cayma Hakkı ve Dijital İçerik İstisnası</h4>
      <p>
        6502 sayılı Tüketicinin Korunması Hakkında Kanun&#39;un 48&#39;inci maddesi ile Mesafeli Sözleşmeler Yönetmeliği&#39;nin 15/1&#40;a&#41; bendi uyarınca;
      </p>
      <p style={{ border: '1px solid #fc8181', borderRadius: 6, padding: '10px 14px', background: 'rgba(252,129,129,0.07)', marginTop: 8 }}>
        <strong>Dijital içerik ve dijital hizmetlerde, tüketicinin sözleşmenin kurulmasından önce onayı ile ifaya başlanmış olması halinde cayma hakkı kullanılamaz.</strong>
      </p>
      <p style={{ marginTop: 8 }}>
        Ödeme gerçekleştiği anda hizmet ifasına başlanacak ve alıcı bu başlatma onayını "Okudum, anladım, kabul ediyorum" düğmesine tıklamasıyla vermiş olacaktır. Bu nedenle <strong>14 günlük yasal cayma süresinden yararlanamayacaksınız.</strong>
      </p>

      <h4 style={{ marginTop: 16 }}>6. İptal ve Erken Sona Erdirme</h4>
      <p>Alıcı, aktif aboneliğini hesap ayarlarından istediği zaman iptal edebilir. İptal, mevcut abonelik dönemi sona erene kadar erişimi sürdürür; kalan süre için geri ödeme yapılmaz. Dönem bitmeden tahsilat yapılmaz.</p>

      <h4 style={{ marginTop: 16 }}>7. Teknik Arıza</h4>
      <p>Mettlo&#39;nun teknik kusurundan kaynaklanan ve koçun içerik sunumunu engellemeyen erişim sorunlarında, Mettlo isteğe bağlı olarak abonelik süresini uzatır veya ilgili dönemin bedelini iade eder.</p>

      <h4 style={{ marginTop: 16 }}>8. Kişisel Verilerin Korunması</h4>
      <p>Ödeme bilgileri yalnızca iyzico güvenli altyapısı üzerinden işlenir; kart numarası ve güvenlik kodu Mettlo sunucularına iletilmez ve saklanmaz. Kişisel verilerin işlenmesine ilişkin ayrıntılar için bkz. <a href="/privacy" target="_blank" rel="noopener noreferrer">Gizlilik Politikası</a> ve <a href="/data-protection" target="_blank" rel="noopener noreferrer">KVKK Aydınlatma Metni</a>.</p>

      <h4 style={{ marginTop: 16 }}>9. Uyuşmazlık Çözümü</h4>
      <p>İşbu sözleşmeden doğan uyuşmazlıklarda T.C. mahkemeleri ve Tüketici Hakem Heyetleri yetkilidir. Kanuni sınır altındaki tüketici uyuşmazlıkları için ilgili Tüketici Hakem Heyeti&#39;ne başvurulabilir.</p>

      <p style={{ marginTop: 20, fontSize: 12, color: '#718096' }}>Sözleşme tarihi, ödemenin gerçekleştiği andır. Mettlo, ödeme onayı ile birlikte bu sözleşmenin bir özetini kayıtlı e-posta adresinize gönderecektir.</p>
    </>
  );
}
