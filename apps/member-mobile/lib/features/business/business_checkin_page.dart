import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/tokens.dart';

class BusinessCheckInPage extends ConsumerStatefulWidget {
  const BusinessCheckInPage({super.key});

  @override
  ConsumerState<BusinessCheckInPage> createState() => _BusinessCheckInPageState();
}

class _BusinessCheckInPageState extends ConsumerState<BusinessCheckInPage> {
  final MobileScannerController _scanner = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
  );
  bool _processing = false;
  String? _resultMsg;
  bool _success = false;

  @override
  void dispose() {
    _scanner.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_processing) return;
    final qrToken = capture.barcodes.firstOrNull?.rawValue;
    if (qrToken == null) return;

    setState(() { _processing = true; _resultMsg = null; });
    await _scanner.stop();

    try {
      final result = await ref.read(apiClientProvider).post('/business/checkin', body: {
        'qrToken': qrToken,
        'platform': 'mobile',
      }) as Map<String, dynamic>;

      final businessName = (result['business'] as Map<String, dynamic>?)?['name'] ?? 'İşletme';
      final locationName = (result['location'] as Map<String, dynamic>?)?['name'] ?? '';

      if (mounted) setState(() {
        _success = true;
        _resultMsg = '$businessName${locationName.isNotEmpty ? ' – $locationName' : ''}\niçinde check-in yapıldı!';
      });
    } on ApiException catch (e) {
      if (mounted) setState(() {
        _success = false;
        _resultMsg = e.message;
      });
    } catch (e) {
      if (mounted) setState(() {
        _success = false;
        _resultMsg = 'Bir hata oluştu. Tekrar deneyin.';
      });
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  void _retry() {
    setState(() { _resultMsg = null; _success = false; _processing = false; });
    _scanner.start();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: const Text('QR ile Check-in'),
        actions: [
          IconButton(
            icon: ValueListenableBuilder(
              valueListenable: _scanner,
              builder: (_, state, __) => Icon(state.torchState == TorchState.on ? Icons.flash_on : Icons.flash_off),
            ),
            onPressed: () => _scanner.toggleTorch(),
          ),
        ],
      ),
      body: _resultMsg != null
          ? _ResultView(message: _resultMsg!, success: _success, onRetry: _retry, onClose: () => context.pop())
          : Stack(
              alignment: Alignment.center,
              children: [
                MobileScanner(controller: _scanner, onDetect: _onDetect),

                // Tarama çerçevesi
                CustomPaint(
                  size: const Size(250, 250),
                  painter: _ScanFramePainter(),
                ),

                // Metin
                Positioned(
                  bottom: 80,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    decoration: BoxDecoration(color: Colors.black.withOpacity(.6), borderRadius: BorderRadius.circular(20)),
                    child: const Text('İşletme QR kodunu çerçeveye hizalayın', style: TextStyle(color: Colors.white, fontSize: 14)),
                  ),
                ),

                if (_processing)
                  Container(
                    color: Colors.black.withOpacity(.5),
                    child: const Center(child: CircularProgressIndicator(color: MettloColors.primary)),
                  ),
              ],
            ),
    );
  }
}

class _ResultView extends StatelessWidget {
  const _ResultView({required this.message, required this.success, required this.onRetry, required this.onClose});
  final String message;
  final bool success;
  final VoidCallback onRetry;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black,
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(success ? Icons.check_circle_outline : Icons.error_outline, size: 80,
              color: success ? MettloColors.primary : Colors.red.shade400),
          const SizedBox(height: 24),
          Text(
            success ? 'Check-in Başarılı!' : 'Check-in Başarısız',
            style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 12),
          Text(message, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white70, fontSize: 15, height: 1.5)),
          const SizedBox(height: 40),
          if (success) ...[
            FilledButton(onPressed: onClose, child: const Text('Tamam')),
          ] else ...[
            FilledButton(onPressed: onRetry, child: const Text('Tekrar Dene')),
            const SizedBox(height: 12),
            TextButton(onPressed: onClose, child: const Text('Geri Dön', style: TextStyle(color: Colors.white70))),
          ],
        ],
      ),
    );
  }
}

class _ScanFramePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = MettloColors.primary
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;
    const r = 16.0;
    final corners = [
      [Offset(0, r), Offset(0, 0), Offset(r, 0)],
      [Offset(size.width - r, 0), Offset(size.width, 0), Offset(size.width, r)],
      [Offset(size.width, size.height - r), Offset(size.width, size.height), Offset(size.width - r, size.height)],
      [Offset(r, size.height), Offset(0, size.height), Offset(0, size.height - r)],
    ];
    for (final c in corners) {
      canvas.drawLine(c[0], c[1], paint);
      canvas.drawLine(c[1], c[2], paint);
    }
  }

  @override
  bool shouldRepaint(_) => false;
}
