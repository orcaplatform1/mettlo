import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/api_client.dart';
import '../theme/tokens.dart';

/// Gradient (Sunrise) birincil düğme — tasarım sistemindeki "primary button".
class MettloButton extends StatelessWidget {
  const MettloButton({super.key, required this.label, required this.onPressed, this.loading = false, this.secondary = false, this.icon});
  final String label;
  final VoidCallback? onPressed;
  final bool loading, secondary;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final disabled = onPressed == null || loading;
    final child = loading
        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
        : Row(mainAxisSize: MainAxisSize.min, children: [
            if (icon != null) ...[Icon(icon, size: 18), const SizedBox(width: 8)],
            Flexible(child: Text(label, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14))),
          ]);
    return Opacity(
      opacity: disabled && !loading ? 0.45 : 1,
      child: Material(
        color: Colors.transparent,
        child: Ink(
          height: 48,
          decoration: BoxDecoration(
            gradient: secondary ? null : MettloColors.gradientSunrise,
            color: secondary ? const Color(0x0FFFFFFF) : null,
            border: secondary ? Border.all(color: MettloColors.borderSubtle) : null,
            borderRadius: BorderRadius.circular(MettloRadius.md),
          ),
          child: InkWell(
            borderRadius: BorderRadius.circular(MettloRadius.md),
            onTap: disabled ? null : onPressed,
            child: Center(child: DefaultTextStyle.merge(style: const TextStyle(color: Colors.white), child: IconTheme.merge(data: const IconThemeData(color: Colors.white), child: child))),
          ),
        ),
      ),
    );
  }
}

/// Mavi doğrulama rozeti (yalnızca doğrulanmış koçlar). Marka rengi değildir.
class VerifiedBadge extends StatelessWidget {
  const VerifiedBadge({super.key, this.size = 18});
  final double size;
  @override
  Widget build(BuildContext context) => Icon(Icons.verified, size: size, color: MettloColors.verified, semanticLabel: 'Doğrulanmış koç');
}

/// Mettlo kıdem rozeti: 6 ay / 1 yıl / 2 yıl.
class TenureBadge extends StatelessWidget {
  const TenureBadge({super.key, required this.tier, required this.label});
  final String tier, label;
  @override
  Widget build(BuildContext context) {
    final (bg, fg, icon) = switch (tier) {
      '24m' => (null, const Color(0xFF0B1220), Icons.emoji_events),
      '12m' => (MettloColors.accent.withValues(alpha: .16), MettloColors.accent, Icons.workspace_premium),
      _ => (MettloColors.secondary.withValues(alpha: .14), MettloColors.secondary, Icons.spa),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: bg, gradient: tier == '24m' ? MettloColors.gradientGoldenMorning : null, borderRadius: BorderRadius.circular(MettloRadius.pill), border: Border.all(color: fg.withValues(alpha: .4))),
      child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(icon, size: 14, color: fg), const SizedBox(width: 6), Text(label, style: TextStyle(color: fg, fontSize: 12, fontWeight: FontWeight.w700))]),
    );
  }
}

class Pill extends StatelessWidget {
  const Pill(this.text, {super.key, this.color});
  final String text;
  final Color? color;
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(color: (color ?? Colors.white).withValues(alpha: .07), borderRadius: BorderRadius.circular(MettloRadius.pill), border: Border.all(color: MettloColors.borderSubtle)),
        child: Text(text.toUpperCase(), style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, letterSpacing: .6, color: color ?? MettloColors.textSecondary)),
      );
}

/// Profil fotoğrafı (yoksa baş harfler); doğrulanmışsa yanında mavi rozet.
class UserAvatar extends StatelessWidget {
  const UserAvatar({super.key, required this.name, this.url, this.size = 48, this.verified = false});
  final String name;
  final String? url;
  final double size;
  final bool verified;

  @override
  Widget build(BuildContext context) {
    final initials = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).take(2).map((p) => p[0].toUpperCase()).join();
    final inner = ClipOval(
      child: SizedBox(
        width: size,
        height: size,
        child: url != null && url!.isNotEmpty
            ? CachedNetworkImage(imageUrl: url!, fit: BoxFit.cover, errorWidget: (_, _, _) => _fallback(initials))
            : _fallback(initials),
      ),
    );
    if (!verified) return inner;
    return Stack(clipBehavior: Clip.none, children: [
      inner,
      Positioned(right: -2, bottom: -2, child: Container(decoration: const BoxDecoration(color: MettloColors.bg, shape: BoxShape.circle), child: VerifiedBadge(size: (size * .32).clamp(16, 30)))),
    ]);
  }

  Widget _fallback(String initials) => Container(
        decoration: const BoxDecoration(gradient: MettloColors.gradientSunrise),
        alignment: Alignment.center,
        child: Text(initials.isEmpty ? '?' : initials, style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: size * .38)),
      );
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.text, {super.key, this.trailing});
  final String text;
  final Widget? trailing;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 24, bottom: 12),
        child: Row(children: [Expanded(child: Text(text, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontSize: 20))), ?trailing]),
      );
}

class StatTile extends StatelessWidget {
  const StatTile({super.key, required this.icon, required this.value, required this.label});
  final IconData icon;
  final String value, label;
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: MettloColors.surface1, borderRadius: BorderRadius.circular(MettloRadius.lg), border: Border.all(color: MettloColors.borderSubtle)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 18, color: MettloColors.primary),
          const SizedBox(height: 6),
          Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          Text(label, style: const TextStyle(fontSize: 11.5, color: MettloColors.textTertiary)),
        ]),
      );
}

class InfoBanner extends StatelessWidget {
  const InfoBanner(this.text, {super.key, this.error = false});
  final String text;
  final bool error;
  @override
  Widget build(BuildContext context) {
    final c = error ? MettloColors.error : MettloColors.secondary;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: c.withValues(alpha: .08), borderRadius: BorderRadius.circular(MettloRadius.md), border: Border.all(color: c.withValues(alpha: .3))),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(error ? Icons.error_outline : Icons.info_outline, size: 18, color: c),
        const SizedBox(width: 10),
        Expanded(child: Text(text, style: TextStyle(color: error ? MettloColors.error : MettloColors.textSecondary, fontSize: 13.5))),
      ]),
    );
  }
}

/// FutureProvider sonuçları için yükleniyor / hata / veri gövdesi.
class AsyncBody<T> extends StatelessWidget {
  const AsyncBody({super.key, required this.value, required this.builder, this.onRetry});
  final AsyncValue<T> value;
  final Widget Function(T data) builder;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) => value.when(
        data: builder,
        loading: () => const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator(color: MettloColors.primary))),
        error: (e, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              InfoBanner(e is ApiException ? e.message : 'Bir hata oluştu.', error: true),
              if (onRetry != null) ...[const SizedBox(height: 12), TextButton(onPressed: onRetry, child: const Text('Tekrar dene'))],
            ]),
          ),
        ),
      );
}

/// Şifre alanı: göz ikonu ile göster/gizle.
class PasswordField extends StatefulWidget {
  const PasswordField({super.key, required this.controller, this.label = 'Şifre', this.validator, this.textInputAction, this.onSubmitted, this.hint = '6–20 karakter'});
  final TextEditingController controller;
  final String label, hint;
  final String? Function(String?)? validator;
  final TextInputAction? textInputAction;
  final void Function(String)? onSubmitted;

  @override
  State<PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<PasswordField> {
  bool _visible = false;
  @override
  Widget build(BuildContext context) => TextFormField(
        controller: widget.controller,
        obscureText: !_visible,
        maxLength: 20,
        autofillHints: const [AutofillHints.password],
        textInputAction: widget.textInputAction,
        onFieldSubmitted: widget.onSubmitted,
        validator: widget.validator,
        decoration: InputDecoration(
          labelText: widget.label,
          hintText: widget.hint,
          counterText: '',
          suffixIcon: IconButton(
            tooltip: _visible ? 'Şifreyi gizle' : 'Şifreyi göster',
            icon: Icon(_visible ? Icons.visibility_off_outlined : Icons.visibility_outlined, color: MettloColors.textTertiary),
            onPressed: () => setState(() => _visible = !_visible),
          ),
        ),
      );
}

/// Telefon alanı: "+90" sabit, yalnızca rakam, en fazla 10 hane.
class PhoneField extends StatelessWidget {
  const PhoneField({super.key, required this.controller, this.validator});
  final TextEditingController controller;
  final String? Function(String?)? validator;
  @override
  Widget build(BuildContext context) => TextFormField(
        controller: controller,
        keyboardType: TextInputType.number,
        maxLength: 10,
        autofillHints: const [AutofillHints.telephoneNumberNational],
        inputFormatters: [_DigitsOnly()],
        validator: validator,
        decoration: const InputDecoration(labelText: 'Telefon', hintText: '5XXXXXXXXX', counterText: '', prefix: Padding(padding: EdgeInsets.only(right: 10), child: Text('🇹🇷  +90', style: TextStyle(color: MettloColors.textPrimary, fontWeight: FontWeight.w600)))),
      );
}

class _DigitsOnly extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    final digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    final cut = digits.length > 10 ? digits.substring(0, 10) : digits;
    return TextEditingValue(text: cut, selection: TextSelection.collapsed(offset: cut.length));
  }
}
