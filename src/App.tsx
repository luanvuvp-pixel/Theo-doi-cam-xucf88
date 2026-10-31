import React, { useEffect, useState } from 'react';
import { DiaryEntry, NavTab, User } from './types';
import { api, tokenStorage } from './utils/api';
import { firestoreService, firebaseAuth, testConnection } from './services/firebase';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { EntryDetailModal } from './components/EntryDetailModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { DashboardPage } from './pages/DashboardPage';
import { WritePage } from './pages/WritePage';
import { JournalPage } from './pages/JournalPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AccountPage } from './pages/AccountPage';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Diary Entries
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);

  // Modals & Actions
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<DiaryEntry | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check user authentication on initial load via Firebase Auth
  useEffect(() => {
    testConnection().catch(() => {});

    // Listen to Firebase auth state as single source of truth
    const unsubscribeAuth = firebaseAuth.onStateChanged((fbUser) => {
      if (fbUser) {
        const userObj: User = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Người dùng',
          email: fbUser.email || '',
          createdAt: new Date().toISOString(),
        };
        setCurrentUser(userObj);
        tokenStorage.set(fbUser.uid);
        firestoreService.saveUserProfile(userObj).catch(() => {});
        setIsAuthChecking(false);
      } else {
        setCurrentUser(null);
        tokenStorage.clear();
        setIsAuthChecking(false);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Fetch entries & subscribe to Firestore in realtime when user is authenticated
  const loadEntries = async () => {
    if (!currentUser) return;
    setIsLoadingEntries(true);
    try {
      const res = await api.entries.getAll();
      setEntries(res.entries);
    } catch (err) {
      console.error('Không thể tải danh sách nhật ký:', err);
    } finally {
      setIsLoadingEntries(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      setEntries([]);
      return;
    }

    // Load initial entries from server
    loadEntries();

    // Subscribe to Firestore entries in real-time
    const unsubscribeFirestore = firestoreService.subscribeUserEntries(
      currentUser.id,
      (firestoreEntries) => {
        if (firestoreEntries && firestoreEntries.length > 0) {
          setEntries(firestoreEntries);
        }
      },
      (_err) => {
        // Fallback to local API gracefully
        loadEntries();
      }
    );

    return () => {
      unsubscribeFirestore();
    };
  }, [currentUser]);

  // Auth Handlers
  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentTab('dashboard');
  };

  const handleLogout = async () => {
    try {
      await firebaseAuth.logout();
    } catch {}
    await api.auth.logout();
    setCurrentUser(null);
    setSelectedEntry(null);
    setEntryToDelete(null);
    setEntries([]);
  };

  // Entry Created Handler
  const handleEntryCreated = (newEntry: DiaryEntry) => {
    setEntries((prev) => [newEntry, ...prev]);

    // Also sync to Firestore Console
    if (currentUser) {
      firestoreService.addEntry(currentUser.id, newEntry).catch((err) => {
        console.warn('Firestore sync notice:', err.message || err);
      });
    }

    // If analyzed or pending, open detail view so user can appreciate analysis immediately
    if (newEntry.status === 'done') {
      setSelectedEntry(newEntry);
    }
  };

  // Trigger Gemini Analysis for an entry
  const handleAnalyzeEntry = async (id: string) => {
    setAnalyzingId(id);
    try {
      const res = await api.entries.analyze(id);
      const updated = res.entry;

      // Update in entries state
      setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));

      // Sync updated analysis into Firestore
      if (currentUser) {
        firestoreService.updateEntry(currentUser.id, updated.id, updated).catch((err) => {
          console.warn('Firestore update notice:', err.message || err);
        });
      }

      // Update in selected entry modal if open
      if (selectedEntry?.id === updated.id) {
        setSelectedEntry(updated);
      }
    } catch (err: any) {
      // Re-fetch to get the 'failed' status and error message
      loadEntries();
      if (selectedEntry?.id === id) {
        try {
          const fresh = await api.entries.getById(id);
          setSelectedEntry(fresh.entry);
        } catch {}
      }
    } finally {
      setAnalyzingId(null);
    }
  };

  // Delete Entry Handlers
  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;
    setIsDeleting(true);
    try {
      // Delete from Firestore
      if (currentUser) {
        firestoreService.deleteEntry(currentUser.id, entryToDelete.id).catch((err) => {
          console.warn('Firestore delete notice:', err.message || err);
        });
      }

      await api.entries.delete(entryToDelete.id);
      setEntries((prev) => prev.filter((e) => e.id !== entryToDelete.id));

      if (selectedEntry?.id === entryToDelete.id) {
        setSelectedEntry(null);
      }
      setEntryToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Không thể xóa bài viết. Vui lòng thử lại.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#181224] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F2994A] to-[#B794F4] p-0.5 animate-pulse shadow-xl">
            <div className="w-full h-full bg-[#181224] rounded-2xl flex items-center justify-center text-xl">
              🌙
            </div>
          </div>
          <p className="text-sm text-slate-300 font-medium">Đang khởi tạo không gian Emotion Care...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#181224] text-slate-100 flex mystic-gradient">
      {/* Auth Modal if user is not logged in */}
      <AuthModal isOpen={!currentUser} onSuccess={handleAuthSuccess} />

      {/* Main App Layout */}
      {currentUser && (
        <>
          {/* Left Navigation Sidebar */}
          <Sidebar
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            user={currentUser}
            onLogout={handleLogout}
            isMobileOpen={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
            entryCount={entries.length}
          />

          {/* Main Content Area */}
          <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
            <Header
              currentTab={currentTab}
              onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
              onNavigateToWrite={() => setCurrentTab('write')}
            />

            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              {currentTab === 'dashboard' && (
                <DashboardPage
                  user={currentUser}
                  entries={entries}
                  onNavigateToWrite={() => setCurrentTab('write')}
                  onSelectEntry={setSelectedEntry}
                />
              )}

              {currentTab === 'write' && (
                <WritePage
                  user={currentUser}
                  onEntryCreated={handleEntryCreated}
                  onNavigateToJournal={() => setCurrentTab('journal')}
                />
              )}

              {currentTab === 'journal' && (
                <JournalPage
                  entries={entries}
                  onSelectEntry={setSelectedEntry}
                  onAnalyzeEntry={handleAnalyzeEntry}
                  onDeleteRequest={setEntryToDelete}
                  onNavigateToWrite={() => setCurrentTab('write')}
                  analyzingId={analyzingId}
                />
              )}

              {currentTab === 'analytics' && (
                <AnalyticsPage
                  entries={entries}
                  onNavigateToWrite={() => setCurrentTab('write')}
                />
              )}

              {currentTab === 'account' && (
                <AccountPage
                  user={currentUser}
                  entries={entries}
                  onLogout={handleLogout}
                />
              )}
            </main>
          </div>

          {/* Entry Detail Modal */}
          <EntryDetailModal
            isOpen={Boolean(selectedEntry)}
            entry={selectedEntry}
            onClose={() => setSelectedEntry(null)}
            onAnalyze={handleAnalyzeEntry}
            onDeleteRequest={(entry) => {
              setEntryToDelete(entry);
            }}
            isAnalyzing={Boolean(selectedEntry && analyzingId === selectedEntry.id)}
          />

          {/* Delete Confirmation Modal */}
          <DeleteConfirmModal
            isOpen={Boolean(entryToDelete)}
            title={entryToDelete?.title}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setEntryToDelete(null)}
            isDeleting={isDeleting}
          />
        </>
      )}
    </div>
  );
}
