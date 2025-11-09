import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { UserIcon, StarIcon } from './Icons';
import Spinner from './Spinner';

const Profile: React.FC = () => {
  const { user, verifyUser, updateUserProfile } = useUser();
  const [isEditing, setIsEditing] = useState(false);

  // Initialize formData only when user is available
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  // Effect to update form when user data changes (e.g., on login)
  React.useEffect(() => {
    if (user) {
      setFormData({ name: user.name, email: user.email });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Spinner />
        <p className="mt-4 text-gray-400">正在載入使用者資料...</p>
      </div>
    );
  }
  
  const handleVerify = () => {
      alert("驗證碼已發送至您的手機。請輸入驗證碼 123456 (此為示意流程)");
      verifyUser();
      alert("手機驗證成功！您現在可以發起或加入揪團了。");
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateUserProfile({ name: formData.name, email: formData.email });
    setIsEditing(false);
    alert('個人資料已更新！');
  };

  const handleCancel = () => {
    setFormData({ name: user.name, email: user.email });
    setIsEditing(false);
  };
  
  const handleChangeAvatar = () => {
    // In a real app, this would open a file picker. Here we simulate it.
    const newAvatarId = `a${Math.random().toString(36).substring(7)}`;
    const newAvatarUrl = `https://i.pravatar.cc/150?u=${newAvatarId}`;
    if (window.confirm('您確定要更換頭像嗎？')) {
        updateUserProfile({ avatarUrl: newAvatarUrl });
        alert('頭像已更新！');
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 flex items-center">
        <UserIcon className="w-8 h-8 mr-3 text-cyan-400" />
        個人檔案
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar and basic info */}
        <div className="md:col-span-1 flex flex-col items-center">
          <div className="relative">
             <img src={user.avatarUrl} alt={user.name} className="w-40 h-40 rounded-full border-4 border-cyan-500" />
             <button onClick={handleChangeAvatar} className="absolute bottom-1 right-1 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
             </button>
          </div>
          <h3 className="mt-4 text-2xl font-bold text-white">{user.name}</h3>
          <div className="flex items-center gap-2 text-yellow-400 mt-2">
            <StarIcon className="w-6 h-6" />
            <span className="text-lg font-bold">信任分數: {user.trustScore.toFixed(1)}</span>
          </div>
        </div>

        {/* Right Column: Details and Actions */}
        <div className="md:col-span-2 space-y-8">
          {/* Account Info */}
           <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                 <h4 className="text-xl font-semibold text-white">帳號資訊</h4>
                 {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-full hover:bg-gray-600 transition-colors">編輯</button>
                 ) : (
                    <div className="flex gap-2">
                        <button onClick={handleSave} className="px-4 py-2 bg-cyan-600 text-white font-semibold rounded-full hover:bg-cyan-500 transition-colors">儲存</button>
                        <button onClick={handleCancel} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-full hover:bg-gray-500 transition-colors">取消</button>
                    </div>
                 )}
            </div>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400">使用者名稱</label>
                    {isEditing ? (
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    ) : (
                        <p className="text-white text-lg mt-1">{user.name}</p>
                    )}
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-400">電子郵件</label>
                    {isEditing ? (
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    ) : (
                        <p className="text-white text-lg mt-1">{user.email}</p>
                    )}
                </div>
            </div>
          </div>

          {/* Phone Verification */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h4 className="text-xl font-semibold text-white mb-3">安全驗證</h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">手機實名驗證</p>
                <p className={`text-sm ${user.isVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                  狀態：{user.isVerified ? '✓ 已驗證' : '未驗證 (功能受限)'}
                </p>
              </div>
              {!user.isVerified && (
                <button
                    onClick={handleVerify} 
                    className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-full hover:bg-teal-500 transition-colors"
                >
                  進行驗證
                </button>
              )}
            </div>
             <p className="text-xs text-gray-400 mt-3">為了保障社群安全，您必須完成手機驗證才能發起或加入揪團。</p>
          </div>

          {/* Movie Persona */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h4 className="text-xl font-semibold text-white mb-4">我的 Movie Persona</h4>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">觀影習慣標籤</label>
              <div className="flex flex-wrap gap-2">
                {user.viewingHabitTags.map(tag => (
                  <span key={tag} className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full">{tag}</span>
                ))}
                <button className="text-cyan-400 text-sm hover:underline">+ 新增/編輯</button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              請注意：您的個人檔案**只會**顯示觀影相關資訊。我們**禁止**用戶分享身高、職業等敏感個資，以確保社群專注於電影同好交流。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
