/// Sunucudaki kurallarla (packages/validation) birebir aynı istemci doğrulamaları.
class Validators {
  Validators._();

  static const passwordMin = 6;
  static const passwordMax = 20;

  /// Şifre: en az 6, en çok 20 karakter.
  static String? password(String? v) {
    final s = v ?? '';
    if (s.isEmpty) return 'Şifre gerekli';
    if (s.length < passwordMin) return 'Şifre en az $passwordMin karakter olmalı';
    if (s.length > passwordMax) return 'Şifre en fazla $passwordMax karakter olabilir';
    return null;
  }

  /// E-posta: @ işareti zorunlu ve geçerli biçim.
  static String? email(String? v) {
    final s = (v ?? '').trim();
    if (s.isEmpty) return 'E-posta gerekli';
    if (!s.contains('@')) return 'E-posta @ işareti içermeli';
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]{2,}$').hasMatch(s)) return 'Geçerli bir e-posta adresi girin';
    return null;
  }

  /// Telefon: "+90" sabit; yalnızca rakam, tam 10 hane (5XXXXXXXXX).
  static String? phone(String? v) {
    final s = (v ?? '').trim();
    if (s.isEmpty) return 'Telefon gerekli';
    if (!RegExp(r'^\d+$').hasMatch(s)) return 'Telefon yalnızca rakamlardan oluşmalı';
    if (s.length != 10) return 'Telefon numarası tam 10 haneli olmalı (5XXXXXXXXX)';
    return null;
  }

  static final _usernameRe = RegExp(r'^[a-z0-9_]{3,30}$');
  static const reservedUsernames = {
    'admin', 'administrator', 'api', 'app', 'auth', 'login', 'logout', 'register', 'signup', 'signin', 'creator', 'creators', 'coach', 'coaches',
    'member', 'members', 'user', 'users', 'me', 'root', 'support', 'help', 'about', 'contact', 'careers', 'pricing', 'explore', 'programs', 'program',
    'challenges', 'challenge', 'live', 'community', 'communities', 'store', 'shop', 'product', 'products', 'brand', 'brands', 'category', 'categories',
    'checkout', 'cart', 'orders', 'settings', 'profile', 'privacy', 'terms', 'kvkk', 'faq', 'sitemap', 'robots', 'static', 'assets', 'public', 'mettlo',
    'staff', 'moderator', 'superadmin', 'system', 'null', 'undefined', 'www', 'mail', 'ftp', 'blog', 'news', 'status', 'security', 'legal',
  };

  static String? username(String? v) {
    final s = (v ?? '').trim().toLowerCase();
    if (s.isEmpty) return 'Kullanıcı adı gerekli';
    if (!_usernameRe.hasMatch(s) || reservedUsernames.contains(s)) {
      return 'Kullanıcı adı 3-30 karakter, yalnızca a-z, 0-9 ve _ olabilir ve ayrılmış bir kelime olamaz';
    }
    return null;
  }

  static String? required(String? v, [String label = 'Bu alan']) => (v ?? '').trim().isEmpty ? '$label gerekli' : null;

  static int ageOn(DateTime birth, [DateTime? now]) {
    final n = now ?? DateTime.now();
    var age = n.year - birth.year;
    if (n.month < birth.month || (n.month == birth.month && n.day < birth.day)) age--;
    return age;
  }

  /// Mettlo 18+ içindir; 18 altı yalnızca ebeveyn/vasi kaydıyla (web üzerinden).
  static String? birthDate(DateTime? d) {
    if (d == null) return 'Doğum tarihi gerekli';
    if (ageOn(d) < 18) return '18 yaşından küçükler yalnızca ebeveyn / yasal vasi kaydı ile üye olabilir.';
    return null;
  }

  /// Koç metinlerinde bağlantı, sosyal medya, telefon ve e-posta yasak (sunucu da denetler).
  static bool containsExternalContact(String text) {
    final t = text.toLowerCase();
    const tlds = 'com|net|org|edu|gov|info|biz|tr|io|me|co|app|link|ly|xyz|gg|tv|site|online|shop|store|blog|dev|ai|cc|ws|to|fit|life|club|live|pro|page|bio|cloud|top|vip';
    return RegExp(r'(instagram|tiktok|youtube|facebook|twitter|telegram|whatsapp|snapchat|linkedin|discord)').hasMatch(t) ||
        RegExp('(https?://|www\\.|\\b[a-z0-9-]{2,}\\s?\\.\\s?($tlds)\\b)').hasMatch(t) ||
        RegExp(r'(^|\s)@[a-z0-9_.]{3,}').hasMatch(t) ||
        RegExp(r'[^\s@]+@[^\s@]+\.[a-z]{2,}').hasMatch(t) ||
        RegExp(r'(?:\d[\s.\-()_/]*){10,}').hasMatch(t);
  }
}
