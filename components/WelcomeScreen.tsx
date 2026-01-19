
import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { authService } from '../services/authService';
import { AdminRecord } from '../types';

interface WelcomeScreenProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onUserComplete: (name: string, lastName: string) => void;
  onAdminComplete: (admin: AdminRecord) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  isDark, 
  onToggleTheme, 
  onUserComplete,
  onAdminComplete
}) => {
  const [mode, setMode] = useState<'initial' | 'user' | 'admin-select' | 'admin-master' | 'admin-setup' | 'admin-login'>('initial');
  const [userInfo, setUserInfo] = useState({ name: '', lastName: '' });
  const [adminSetup, setAdminSetup] = useState({ name: '', lastName: '', password: '' });
  const [adminPass, setAdminPass] = useState('');
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [availableAdmins, setAvailableAdmins] = useState<AdminRecord[]>([]);

  const loadAdmins = async () => {
    const admins = await authService.getAllAdmins();
    setAvailableAdmins(admins);
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInfo.name && userInfo.lastName) {
      onUserComplete(userInfo.name, userInfo.lastName);
    }
  };

  const handleMasterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    const isValid = await authService.verifyMasterPassword(adminPass);
    if (isValid) {
      setMode('admin-setup');
      setAdminPass('');
      setError('');
    } else {
      setError('Invalid master password.');
    }
    setIsVerifying(false);
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSetup.name || !adminSetup.lastName || !adminSetup.password) {
      setError('Please fill all fields.');
      return;
    }
    setIsVerifying(true);
    try {
      const newAdmin = await authService.registerPersonalAdmin(adminSetup.name, adminSetup.lastName, adminSetup.password);
      onAdminComplete(newAdmin);
    } catch (err) {
      setError('Failed to create admin account.');
    }
    setIsVerifying(false);
  };

  const handlePersonalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    const admin = await authService.verifyPersonalAdmin(selectedAdminId, adminPass);
    if (admin) {
      onAdminComplete(admin);
    } else {
      setError('Invalid personal password.');
    }
    setIsVerifying(false);
  };

  const adminCardClass = "p-8 bg-white dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300 text-left";
  const labelClass = "text-[10px] font-bold uppercase tracking-widest opacity-40";
  const inputClass = `w-full bg-transparent border-b-2 py-2 outline-none transition-all ${isDark ? 'border-white/10 text-[#C28840] focus:border-[#C28840]' : 'border-slate-100 text-[#517488] focus:border-[#517488]'}`;
  const actionBtnClass = "px-8 py-2.5 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md mx-auto";
  const adminPrimaryBtnColor = "bg-[#2D3B4D] dark:bg-[#C28840]";

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center p-6 transition-colors duration-500 relative overflow-hidden ${isDark ? 'bg-[#2D3B4D]' : 'bg-[#F5F1EB]'}`}>
      
      <button onClick={onToggleTheme} className={`absolute top-12 right-12 transition-colors ${isDark ? 'text-[#C28840]' : 'text-[#517488]'}`}>
        <Icon name={isDark ? "Sun" : "Moon"} size={24} />
      </button>

      <div className="mb-12 relative text-center max-w-md">
        <div className={`w-28 h-28 mx-auto mb-8 rounded-[2rem] shadow-2xl flex items-center justify-center bg-white transform hover:rotate-6 transition-transform cursor-default`}>
          <span className={`text-5xl font-black tracking-tighter text-[#517488]`}>Cal</span>
        </div>
        <h1 className={`text-4xl md:text-5xl font-black tracking-tighter mb-4 ${isDark ? 'text-white' : 'text-[#2D3B4D]'}`}>
          Welcome to Cal
        </h1>
        <p className={`text-lg md:text-xl font-medium opacity-60 leading-relaxed ${isDark ? 'text-white' : 'text-[#517488]'}`}>
          Refined event management for exceptional people. Effortless, elegant, and always up to date.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4 text-center">
        {mode === 'initial' && (
          <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <button 
              onClick={() => setMode('user')}
              className={`px-8 py-2.5 bg-[#C28840] text-white font-bold text-lg rounded-2xl transition-all active:scale-95 shadow-lg hover:shadow-[#C28840]/30 hover:bg-[#D39951]`}
            >
              Continue to App
            </button>
            <p className="text-xs font-bold opacity-30 uppercase tracking-[0.3em]">Standard Member Entry</p>
          </div>
        )}

        {mode === 'user' && (
          <form onSubmit={handleUserSubmit} className={adminCardClass}>
            <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#2D3B4D]'}`}>User Access</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className={labelClass}>First Name</label>
                <input autoFocus required type="text" className={inputClass} value={userInfo.name} onChange={e => setUserInfo({ ...userInfo, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Last Name</label>
                <input required type="text" className={inputClass} value={userInfo.lastName} onChange={e => setUserInfo({ ...userInfo, lastName: e.target.value })} />
              </div>
            </div>
            <button type="submit" className={`px-8 py-2.5 ${adminPrimaryBtnColor} text-white font-bold text-lg rounded-2xl transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 mx-auto`}>Let's Go</button>
            <button type="button" onClick={() => setMode('initial')} className="w-full text-xs font-bold text-slate-400 uppercase tracking-widest hover:underline text-center">Back</button>
          </form>
        )}

        {(mode === 'admin-select' || mode === 'admin-master') && (
          <div className={adminCardClass}>
            <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#2D3B4D]'}`}>Admin Portal</h3>
            
            {availableAdmins.length > 0 && mode === 'admin-select' ? (
              <div className="space-y-4">
                <p className="text-xs font-bold opacity-50 uppercase tracking-widest">Select Account</p>
                <div className="max-h-48 overflow-y-auto pr-2 space-y-2 no-scrollbar">
                  {availableAdmins.map(admin => (
                    <button key={admin.id} onClick={() => { setSelectedAdminId(admin.id); setMode('admin-login'); }} className="w-full flex items-center gap-3 p-3 rounded-xl border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-[#C28840] flex items-center justify-center text-white font-bold">{admin.name.charAt(0)}</div>
                      <div className="text-left">
                        <p className="font-bold text-sm dark:text-white">{admin.name}</p>
                        <p className="text-[10px] opacity-40 uppercase">Personal Account</p>
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={() => setMode('admin-master')} className="w-full py-2 text-xs font-bold text-[#517488] dark:text-[#C28840] uppercase tracking-widest hover:underline text-center">+ New Admin Access</button>
              </div>
            ) : (
              <form onSubmit={handleMasterSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className={labelClass}>Master Password</label>
                  <input autoFocus required type="password" className={inputClass} value={adminPass} onChange={e => { setAdminPass(e.target.value); setError(''); }} />
                  {error && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{error}</p>}
                </div>
                <button type="submit" disabled={isVerifying} className={`${actionBtnClass} ${adminPrimaryBtnColor}`}>
                  {isVerifying && <Icon name="Loader2" className="animate-spin" size={14}/>}
                  Authenticate
                </button>
                {availableAdmins.length > 0 && (
                  <button type="button" onClick={() => setMode('admin-select')} className="w-full text-xs font-bold text-slate-400 uppercase tracking-widest hover:underline text-center">Back to List</button>
                )}
              </form>
            )}
            <button type="button" onClick={() => setMode('initial')} className="w-full text-xs font-bold text-slate-400 uppercase tracking-widest hover:underline text-center">Cancel</button>
          </div>
        )}

        {mode === 'admin-setup' && (
          <form onSubmit={handleSetupSubmit} className={adminCardClass}>
            <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#2D3B4D]'}`}>Personalize Admin</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className={labelClass}>First Name</label>
                <input required type="text" className={inputClass} value={adminSetup.name} onChange={e => setAdminSetup({...adminSetup, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Last Name</label>
                <input required type="text" className={inputClass} value={adminSetup.lastName} onChange={e => setAdminSetup({...adminSetup, lastName: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Personal Password</label>
                <input required type="password" className={inputClass} value={adminSetup.password} onChange={e => setAdminSetup({...adminSetup, password: e.target.value})} />
              </div>
            </div>
            {error && <p className="text-red-500 text-[10px] font-bold uppercase">{error}</p>}
            <button type="submit" disabled={isVerifying} className={`${actionBtnClass} ${adminPrimaryBtnColor} w-full`}>
              {isVerifying && <Icon name="Loader2" className="animate-spin" size={14}/>}
              Finish Setup
            </button>
          </form>
        )}

        {mode === 'admin-login' && (
          <form onSubmit={handlePersonalLogin} className={adminCardClass}>
             <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#2D3B4D]'}`}>Welcome Back</h3>
             <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{availableAdmins.find(a => a.id === selectedAdminId)?.name}</p>
             <div className="space-y-1">
                <label className={labelClass}>Personal Password</label>
                <input autoFocus required type="password" className={inputClass} value={adminPass} onChange={e => { setAdminPass(e.target.value); setError(''); }} />
                {error && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{error}</p>}
             </div>
             <button type="submit" disabled={isVerifying} className={`${actionBtnClass} ${adminPrimaryBtnColor} w-full`}>
               {isVerifying && <Icon name="Loader2" className="animate-spin" size={16}/>}
               Login
             </button>
             <button type="button" onClick={() => setMode('admin-select')} className="w-full text-xs font-bold text-slate-400 uppercase tracking-widest hover:underline text-center">Back</button>
          </form>
        )}
      </div>

      {mode === 'initial' && (
        <button 
          onClick={() => { loadAdmins().then(() => setMode(availableAdmins.length > 0 ? 'admin-select' : 'admin-master')) }}
          className={`absolute bottom-10 right-10 p-4 flex items-center gap-2 font-bold text-xs uppercase tracking-widest transition-all hover:opacity-100 active:scale-95 ${isDark ? 'text-white/40 hover:text-white' : 'text-[#517488]/40 hover:text-[#517488]'}`}
        >
          <Icon name="ShieldCheck" size={16} />
          Admin Portal
        </button>
      )}
    </div>
  );
};

export default WelcomeScreen;
