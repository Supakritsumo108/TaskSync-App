import { useState, useEffect } from "react";
import { X, Languages, Bell, User, Check } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { t, language: currentLang, setLanguage: setContextLang } = useLanguage();
  const { userProfile, updateUserProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState("notifications");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Settings States
  const [language, setLanguage] = useState(currentLang);
  const [notifyDue, setNotifyDue] = useState(true);
  const [notifyComment, setNotifyComment] = useState(true);
  const [notifyAssign, setNotifyAssign] = useState(true);

  // Profile Edit States
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editJobTitle, setEditJobTitle] = useState("");

  // Sync profile to local states when editing starts
  useEffect(() => {
    if (userProfile) {
      setEditName(userProfile.displayName || "");
      setEditEmail(userProfile.email || "");
      setEditJobTitle(userProfile.jobTitle || "");
    }
  }, [userProfile, isEditingProfile]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("tasksync_lang");
    if (savedLang === "th" || savedLang === "en") setLanguage(savedLang);

    const savedNotifyDue = localStorage.getItem("tasksync_notifyDue");
    if (savedNotifyDue !== null) setNotifyDue(savedNotifyDue === "true");

    const savedNotifyComment = localStorage.getItem("tasksync_notifyComment");
    if (savedNotifyComment !== null)
      setNotifyComment(savedNotifyComment === "true");

    const savedNotifyAssign = localStorage.getItem("tasksync_notifyAssign");
    if (savedNotifyAssign !== null)
      setNotifyAssign(savedNotifyAssign === "true");
  }, []);

  // Save changes to localStorage
  const handleLangChange = (lang: "th" | "en") => {
    setLanguage(lang);
    setContextLang(lang);
  };

  const handleNotifyDueChange = () => {
    const newVal = !notifyDue;
    setNotifyDue(newVal);
    localStorage.setItem("tasksync_notifyDue", String(newVal));
  };

  const handleNotifyCommentChange = () => {
    const newVal = !notifyComment;
    setNotifyComment(newVal);
    localStorage.setItem("tasksync_notifyComment", String(newVal));
  };

  const handleNotifyAssignChange = () => {
    const newVal = !notifyAssign;
    setNotifyAssign(newVal);
    localStorage.setItem("tasksync_notifyAssign", String(newVal));
  };

  const handleSaveProfile = async () => {
    await updateUserProfile({
      displayName: editName,
      email: editEmail,
      jobTitle: editJobTitle
    });
    setIsEditingProfile(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-100 w-full sm:max-w-4xl h-full sm:h-[580px] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col sm:flex-row p-2 sm:p-4 gap-2 sm:gap-4 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile: Horizontal Tabs — hidden on desktop */}
        <div className="sm:hidden flex items-center justify-between px-2 pt-2 pb-1">
          <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm flex-1">
            <button
              onClick={() => setActiveTab("language")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === "language" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Languages size={14} />
              <span>{t('settings.language')}</span>
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === "notifications" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Bell size={14} />
              <span>{t('settings.notifications')}</span>
            </button>
            <button
              onClick={() => setActiveTab("account")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === "account" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <User size={14} />
              <span>{t('settings.account')}</span>
            </button>
          </div>
          <button
            className="ml-2 p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-full transition-colors cursor-pointer"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Desktop: Vertical Sidebar — hidden on mobile */}
        <div className="hidden sm:flex w-56 bg-white rounded-2xl p-4 flex-col gap-1 shrink-0 shadow-sm">
          <button
            onClick={() => setActiveTab("language")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors cursor-pointer mt-2 ${activeTab === "language" ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
          >
            <Languages size={18} />
            <span>{t('settings.language')}</span>
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors cursor-pointer ${activeTab === "notifications" ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
          >
            <Bell size={18} />
            <span>{t('settings.notifications')}</span>
          </button>

          <button
            onClick={() => setActiveTab("account")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors cursor-pointer ${activeTab === "account" ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
          >
            <User size={18} />
            <span>{t('settings.account')}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm p-5 sm:p-10 overflow-y-auto relative">
          <button
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer hidden sm:flex"
            onClick={onClose}
          >
            <X size={20} />
          </button>

          {activeTab === "notifications" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-bold text-slate-800 mb-1">
                {t('settings.notif.title')}
              </h2>
              <p className="text-slate-500 text-sm mb-8">
                {t('settings.notif.desc')}
              </p>

              <div className="flex flex-col gap-6">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-semibold text-slate-400">
                    {t('settings.notif.types')}
                  </h3>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100 pb-6">
                  <div>
                    <h4 className="font-bold text-slate-800">
                      {t('settings.notif.due')}
                    </h4>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {t('settings.notif.dueDesc')}
                    </p>
                  </div>
                  <button
                    onClick={handleNotifyDueChange}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${notifyDue ? "bg-indigo-600" : "bg-slate-200"}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${notifyDue ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100 pb-6">
                  <div>
                    <h4 className="font-bold text-slate-800">
                      {t('settings.notif.comment')}
                    </h4>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {t('settings.notif.commentDesc')}
                    </p>
                  </div>
                  <button
                    onClick={handleNotifyCommentChange}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${notifyComment ? "bg-indigo-600" : "bg-slate-200"}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${notifyComment ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="font-bold text-slate-800">
                      {t('settings.notif.assign')}
                    </h4>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {t('settings.notif.assignDesc')}
                    </p>
                  </div>
                  <button
                    onClick={handleNotifyAssignChange}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${notifyAssign ? "bg-indigo-600" : "bg-slate-200"}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${notifyAssign ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "language" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-bold text-slate-800 mb-1">{t('settings.lang.title')}</h2>
              <p className="text-slate-500 text-sm mb-8">
                {t('settings.lang.desc')}
              </p>

              <div className="flex flex-col gap-4">
                <label
                  className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${language === "th" ? "border-indigo-600 bg-indigo-50/50" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">TH</div>
                    <div>
                      <div className="font-bold text-slate-800">ภาษาไทย</div>
                      <div className="text-sm text-slate-500">Thai</div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="language"
                    value="th"
                    checked={language === "th"}
                    onChange={() => handleLangChange("th")}
                    className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>

                <label
                  className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${language === "en" ? "border-indigo-600 bg-indigo-50/50" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">EN</div>
                    <div>
                      <div className="font-bold text-slate-800">English</div>
                      <div className="text-sm text-slate-500">ภาษาอังกฤษ</div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="language"
                    value="en"
                    checked={language === "en"}
                    onChange={() => handleLangChange("en")}
                    className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === "account" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-bold text-slate-800 mb-1">
                {t('settings.acc.title')}
              </h2>
              <p className="text-slate-500 text-sm mb-8">
                {t('settings.acc.desc')}
              </p>

              <div className="flex flex-col gap-6">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-semibold text-slate-400">
                    {t('settings.acc.profile')}
                  </h3>
                </div>

                {isEditingProfile ? (
                  <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <input 
                        type="email" 
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                      <input 
                        type="text" 
                        value={editJobTitle}
                        onChange={(e) => setEditJobTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button 
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-2 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        {t('settings.acc.cancel')}
                      </button>
                      <button 
                        onClick={handleSaveProfile}
                        className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <Check size={16} />
                        {t('settings.acc.save')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold shrink-0">
                        {userProfile?.displayName ? userProfile.displayName.substring(0, 1).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-slate-800">
                          {userProfile?.displayName || 'User Name'}
                        </h4>
                        <p className="text-slate-500 text-sm">
                          {userProfile?.email || 'email@example.com'}
                        </p>
                        <p className="text-slate-500 text-sm">{userProfile?.jobTitle}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsEditingProfile(true)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-sm w-full sm:w-auto"
                    >
                      {t('settings.acc.edit')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
