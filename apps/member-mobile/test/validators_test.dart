import 'package:flutter_test/flutter_test.dart';
import 'package:mettlo/core/validation/validators.dart';

void main() {
  test('şifre 6-20 karakter', () {
    expect(Validators.password('abc12'), isNotNull);
    expect(Validators.password('abc123'), isNull);
    expect(Validators.password('a' * 20), isNull);
    expect(Validators.password('a' * 21), isNotNull);
  });

  test('e-posta @ zorunlu', () {
    expect(Validators.email('abcgmail.com'), 'E-posta @ işareti içermeli');
    expect(Validators.email('ali@example.com'), isNull);
  });

  test('telefon: yalnızca rakam ve tam 10 hane', () {
    expect(Validators.phone('555111223'), isNotNull); // 9 hane
    expect(Validators.phone('55511122334'), isNotNull); // 11 hane
    expect(Validators.phone('555111223a'), isNotNull);
    expect(Validators.phone('5551112233'), isNull);
  });

  test('kullanıcı adı: ASCII, ayrılmış kelime olamaz', () {
    expect(Validators.username('ahmetyilmaz'), isNull);
    expect(Validators.username('admin'), isNotNull);
    expect(Validators.username('Ali Veli'), isNotNull);
    expect(Validators.username('ab'), isNotNull);
  });

  test('18 yaş sınırı', () {
    final now = DateTime(2026, 9, 25);
    expect(Validators.ageOn(DateTime(2008, 9, 26), now), 17);
    expect(Validators.ageOn(DateTime(2008, 9, 25), now), 18);
    expect(Validators.birthDate(DateTime(2015, 1, 1)), isNotNull);
    expect(Validators.birthDate(DateTime(1990, 1, 1)), isNull);
  });

  test('koç metinlerinde bağlantı / sosyal medya / telefon / e-posta engeli', () {
    for (final bad in ['ahmetfit.com', 'site: ahmet.net', 'www.x.org', 'instagram: ahmet', '@ahmetfit', 'ahmet@gmail.com', '0532 111 22 33', 'wa.me/90532']) {
      expect(Validators.containsExternalContact(bad), isTrue, reason: bad);
    }
    for (final ok in ['8 yıldır güç antrenmanı üzerine çalışıyorum', 'Programlarım 12 hafta sürer, haftada 4 gün']) {
      expect(Validators.containsExternalContact(ok), isFalse, reason: ok);
    }
  });
}
