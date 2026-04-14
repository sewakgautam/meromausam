import { useState } from 'react';
import { useStore } from '../stores/appStore';
import { api } from '../utils/api';

const ALERT_TYPES = [
  { id: 'rain', label: 'Rain', labelNp: 'वर्षा', icon: '🌧️' },
  { id: 'thunder', label: 'Thunder', labelNp: 'बज्रपात', icon: '⚡' },
  { id: 'flood', label: 'Flood', labelNp: 'बाढी', icon: '🌊' },
  { id: 'snow', label: 'Snow', labelNp: 'हिमपात', icon: '❄️' },
  { id: 'hail', label: 'Hail', labelNp: 'असिना', icon: '🌨️' },
  { id: 'heatwave', label: 'Heat Wave', labelNp: 'तापलहर', icon: '🌡️' },
  { id: 'cold', label: 'Cold Wave', labelNp: 'शीतलहर', icon: '🥶' },
  { id: 'fog', label: 'Fog', labelNp: 'कुहिरो', icon: '🌫️' },
];

export default function SubscribePanel() {
  const { selectedDistrict, overview, lang } = useStore();
  const [email, setEmail] = useState('');
  const [districtId, setDistrictId] = useState(selectedDistrict?.id || '');
  const [alertTypes, setAlertTypes] = useState<string[]>(['rain', 'thunder', 'flood', 'hail', 'snow']);
  const [language, setLanguage] = useState(lang);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const districts = overview?.districts || [];

  const toggleType = (id: string) => {
    setAlertTypes(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!email || !districtId || alertTypes.length === 0) {
      setStatus('error');
      setMessage(lang === 'en' ? 'Please fill all fields' : 'सबै फिल्ड भर्नुहोस्');
      return;
    }
    setStatus('loading');
    try {
      const res = await api.subscribe({ email, districtId, alertTypes, language });
      setStatus('success');
      setMessage(res.message);
    } catch (err) {
      setStatus('error');
      setMessage(lang === 'en' ? 'Subscription failed. Please try again.' : 'सदस्यता असफल। पुनः प्रयास गर्नुहोस्।');
    }
  };

  if (status === 'success') {
    return (
      <div className="p-6 text-center animate-fade-up">
        <div className="text-5xl mb-4 animate-float">📧</div>
        <div className="font-display font-700 text-white text-lg mb-2">
          {lang === 'en' ? 'Check your inbox!' : 'इनबक्स जाँच गर्नुहोस्!'}
        </div>
        <div className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>{message}</div>
        <div className="text-xs px-4 py-3 rounded-xl" style={{ background: 'rgba(56,161,105,0.15)', border: '1px solid rgba(104,211,145,0.2)', color: '#68d391' }}>
          {lang === 'en'
            ? 'You\'ll receive a confirmation email. Click the link to activate your alerts.'
            : 'पुष्टि इमेल पठाइएको छ। आफ्नो सूचना सक्रिय गर्न लिङ्क क्लिक गर्नुहोस्।'}
        </div>
        <button
          onClick={() => setStatus('idle')}
          className="mt-4 text-xs underline"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          {lang === 'en' ? 'Subscribe another district' : 'अर्को जिल्ला सदस्यता'}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div>
        <div className="text-xs font-display font-600 mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {lang === 'en' ? 'GET WEATHER ALERTS' : 'मौसम सूचना पाउनुहोस्'}
        </div>
        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {lang === 'en'
            ? 'Daily forecasts + severe weather alerts delivered to your inbox'
            : 'दैनिक पूर्वानुमान र गम्भीर मौसम सूचना इमेलमा पाउनुहोस्'}
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-display font-600 mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
          📧 {lang === 'en' ? 'Email Address' : 'इमेल ठेगाना'}
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={lang === 'en' ? 'your@email.com' : 'तपाईंको@इमेल.com'}
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'white',
          }}
          onFocus={e => (e.target.style.borderColor = 'rgba(144,205,244,0.4)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
        />
      </div>

      {/* District */}
      <div>
        <label className="block text-xs font-display font-600 mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
          📍 {lang === 'en' ? 'District' : 'जिल्ला'}
        </label>
        <select
          value={districtId}
          onChange={e => setDistrictId(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: districtId ? 'white' : 'rgba(255,255,255,0.3)',
          }}
        >
          <option value="" style={{ background: '#0d2137' }}>
            {lang === 'en' ? 'Select district...' : 'जिल्ला छान्नुहोस्...'}
          </option>
          {districts.map(d => (
            <option key={d.id} value={d.id} style={{ background: '#0d2137' }}>
              {lang === 'np' ? d.nameNepali : d.name} — {d.province}
            </option>
          ))}
        </select>
      </div>

      {/* Alert types */}
      <div>
        <label className="block text-xs font-display font-600 mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
          🔔 {lang === 'en' ? 'Alert Types' : 'सूचना प्रकार'}
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {ALERT_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => toggleType(type.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-600 transition-all duration-150"
              style={{
                background: alertTypes.includes(type.id) ? 'rgba(49,130,206,0.25)' : 'rgba(255,255,255,0.05)',
                border: alertTypes.includes(type.id) ? '1px solid rgba(144,205,244,0.3)' : '1px solid rgba(255,255,255,0.08)',
                color: alertTypes.includes(type.id) ? '#90cdf4' : 'rgba(255,255,255,0.45)',
              }}
            >
              <span>{type.icon}</span>
              <span>{lang === 'np' ? type.labelNp : type.label}</span>
              {alertTypes.includes(type.id) && <span className="ml-auto text-xs">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="flex gap-2">
        {(['en', 'np'] as const).map(l => (
          <button
            key={l}
            onClick={() => setLanguage(l)}
            className="flex-1 py-2 rounded-xl text-xs font-display font-600 transition-all"
            style={{
              background: language === l ? 'rgba(49,130,206,0.25)' : 'rgba(255,255,255,0.05)',
              border: language === l ? '1px solid rgba(144,205,244,0.3)' : '1px solid rgba(255,255,255,0.08)',
              color: language === l ? '#90cdf4' : 'rgba(255,255,255,0.4)',
            }}
          >
            {l === 'en' ? '🇬🇧 English' : '🇳🇵 नेपाली'}
          </button>
        ))}
      </div>

      {/* Error */}
      {status === 'error' && (
        <div className="text-xs px-3 py-2 rounded-xl" style={{ background: 'rgba(197,48,48,0.15)', color: '#fc8181', border: '1px solid rgba(252,129,129,0.2)' }}>
          ⚠️ {message}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={status === 'loading'}
        className="w-full py-3 rounded-xl font-display font-700 text-sm transition-all duration-200"
        style={{
          background: status === 'loading'
            ? 'rgba(49,130,206,0.2)'
            : 'linear-gradient(135deg, #2b6cb0, #3182ce)',
          color: 'white',
          border: 'none',
          boxShadow: status !== 'loading' ? '0 4px 16px rgba(49,130,206,0.4)' : 'none',
          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
        }}
      >
        {status === 'loading' ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin inline-block" style={{ borderColor: 'rgba(255,255,255,0.4)', borderTopColor: 'transparent' }} />
            {lang === 'en' ? 'Subscribing...' : 'सदस्यता लिइँदैछ...'}
          </span>
        ) : (
          <span>🔔 {lang === 'en' ? 'Subscribe to Alerts' : 'सूचनाको सदस्यता लिनुहोस्'}</span>
        )}
      </button>

      <div className="text-xs text-center pb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
        {lang === 'en' ? 'Free forever · No spam · Unsubscribe anytime' : 'निःशुल्क · स्प्याम छैन · जुनसुकै बेला हटाउनुस्'}
      </div>
    </div>
  );
}
