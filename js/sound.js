/**
 * Efectos de sonido sintetizados con la Web Audio API: así la app no arrastra
 * ficheros de audio y sigue funcionando sin conexión.
 *
 * En iOS el audio solo se puede iniciar dentro de un gesto del usuario, por eso
 * el contexto se crea en el primer toque y no antes.
 */
window.Sound = (function () {
  var ctx = null;
  var enabled = true;

  function unlock() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    if (ctx.state === "suspended") ctx.resume();
  }

  /** Un tono simple con envolvente para que no suene a pitido pelado. */
  function tone(freq, opts) {
    if (!ctx || !enabled) return;
    opts = opts || {};
    var t0 = ctx.currentTime + (opts.delay || 0);
    var dur = opts.duration || 0.08;
    var gain = ctx.createGain();
    var osc = ctx.createOscillator();

    osc.type = opts.type || "triangle";
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t0 + dur);

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(opts.volume || 0.18, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  /** Ruido corto filtrado: el "golpe" de la pieza al caer. */
  function thud(volume, cutoff) {
    if (!ctx || !enabled) return;
    var dur = 0.09;
    var buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
    }
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    var filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoff || 900;
    var gain = ctx.createGain();
    gain.gain.value = volume || 0.25;
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    src.start();
  }

  var api = {
    unlock: unlock,
    setEnabled: function (on) { enabled = !!on; if (on) unlock(); },
    move: function () { thud(0.22, 800); tone(220, { duration: 0.05, volume: 0.07 }); },
    capture: function () { thud(0.34, 1400); tone(160, { to: 110, duration: 0.09, volume: 0.12 }); },
    check: function () { tone(880, { to: 1180, duration: 0.09, volume: 0.12, type: "square" }); },
    right: function () {
      tone(660, { duration: 0.09, volume: 0.14 });
      tone(990, { duration: 0.13, volume: 0.13, delay: 0.07 });
    },
    wrong: function () {
      tone(200, { to: 120, duration: 0.20, volume: 0.16, type: "sawtooth" });
    },
    win: function () {
      [523, 659, 784, 1046].forEach(function (f, i) {
        tone(f, { duration: 0.16, volume: 0.13, delay: i * 0.075 });
      });
    },
    lose: function () {
      [440, 370, 294, 220].forEach(function (f, i) {
        tone(f, { duration: 0.2, volume: 0.13, delay: i * 0.11, type: "triangle" });
      });
    },
    tick: function () { tone(1200, { duration: 0.03, volume: 0.08, type: "square" }); }
  };

  return api;
})();
