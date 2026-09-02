import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import { supabase } from './supabase';

const GOLD = '#C8A96B';
const BG = '#07111F';
const CARD = '#101C2B';
const CARD_2 = '#172536';
const BORDER = '#27384C';
const WHITE = '#FFFFFF';
const MUTED = '#95A1AF';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [appLoading, setAppLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('home');

  const [stats, setStats] = useState({
    tasks: 0,
    audits: 0,
    checklists: 0,
    critical: 0,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAppLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAppLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadDashboardData();
    } else {
      setProfile(null);
    }
  }, [user]);

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.log('Profile error:', error.message);
      return;
    }

    setProfile(data);
  };

  const loadDashboardData = async () => {
    try {
      const [
        tasksResult,
        auditsResult,
        checklistResult,
        criticalResult,
      ] = await Promise.all([
        supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .neq('status', 'completed'),

        supabase
          .from('audits')
          .select('*', { count: 'exact', head: true })
          .neq('status', 'completed'),

        supabase
          .from('checklist_runs')
          .select('*', { count: 'exact', head: true })
          .neq('status', 'completed'),

        supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('priority', 'critical')
          .neq('status', 'completed'),
      ]);

      setStats({
        tasks: tasksResult.count || 0,
        audits: auditsResult.count || 0,
        checklists: checklistResult.count || 0,
        critical: criticalResult.count || 0,
      });
    } catch (error) {
      console.log('Dashboard error:', error);
    }
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        'Missing information',
        'Please enter your email and password.'
      );
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        Alert.alert('Sign in failed', error.message);
        return;
      }

      setUser(data.user);
    } catch (error) {
      console.log(error);

      Alert.alert(
        'Connection error',
        'Unable to connect to FVH Pulse. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setActiveTab('home');
  };

  const handleForgotPassword = async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      Alert.alert(
        'Email required',
        'Enter your email address first, then tap Forgot password.'
      );
      return;
    }

    try {
      setResettingPassword(true);
      const { error } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail
      );

      if (error) {
        Alert.alert('Reset failed', error.message);
        return;
      }

      Alert.alert(
        'Check your email',
        'We sent you a secure password reset link.'
      );
    } catch (error) {
      console.log('Password reset error:', error);
      Alert.alert(
        'Connection error',
        'Unable to request a password reset. Please try again.'
      );
    } finally {
      setResettingPassword(false);
    }
  };

  if (appLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.loadingLogo}>FVH PULSE</Text>
        <ActivityIndicator
          size="large"
          color={GOLD}
          style={{ marginTop: 25 }}
        />
      </SafeAreaView>
    );
  }

if (!user) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.loginScroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.loginContent}>
          <View style={styles.brandBlock}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>FVH</Text>
            </View>

            <Text style={styles.title}>FVH PULSE</Text>
            <Text style={styles.tagline}>
              Hospitality Operations. Connected.
            </Text>
          </View>

          <View style={styles.loginCard}>
            <Text style={styles.loginHeading}>Welcome back</Text>
            <Text style={styles.loginSubheading}>
              Sign in to access your operation.
            </Text>

            <Text style={styles.fieldLabel}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="name@company.com"
              placeholderTextColor={MUTED}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              editable={!loading}
            />

            <Text style={styles.fieldLabel}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={MUTED}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              editable={!loading}
              onSubmitEditing={handleSignIn}
            />

            <TouchableOpacity
              style={[
                styles.signInButton,
                loading && styles.signInButtonDisabled,
              ]}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={BG} />
              ) : (
                <Text style={styles.signInButtonText}>SIGN IN</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleForgotPassword}
              disabled={resettingPassword || loading}
              style={styles.forgotButton}
            >
              <Text style={styles.forgot}>
                {resettingPassword
                  ? 'SENDING RESET LINK...'
                  : 'Forgot password?'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.loginFooterBlock}>
            <Text style={styles.footer}>
              Powered by Food Ventures Hospitality
            </Text>
            <Text style={styles.secureText}>
              Secure operational access
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

  const userRole = profile?.role || 'user';

  const prettyRole = userRole
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const displayName =
    profile?.full_name || user.email?.split('@')[0] || 'User';

  const HomeScreen = () => (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>FVH PULSE</Text>
          <Text style={styles.headerSubtitle}>Operations Intelligence</Text>
        </View>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.welcomeBlock}>
        <Text style={styles.greeting}>Welcome,</Text>
        <Text style={styles.personName}>{displayName}</Text>

        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{prettyRole}</Text>
        </View>
      </View>

      {userRole === 'super_admin' && (
        <TouchableOpacity
          style={styles.commandCenter}
          onPress={() =>
            Alert.alert(
              'FVH Command Center',
              'Command Center development starts next.'
            )
          }
        >
          <View>
            <Text style={styles.commandLabel}>FVH COMMAND CENTER</Text>
            <Text style={styles.commandTitle}>
              What needs your attention?
            </Text>
          </View>

          <Text style={styles.commandArrow}>â€º</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>Operations Overview</Text>

      <View style={styles.statsRow}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => setActiveTab('tasks')}
        >
          <Text style={styles.statNumber}>{stats.tasks}</Text>
          <Text style={styles.statLabel}>Open Tasks</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => setActiveTab('audits')}
        >
          <Text style={styles.statNumber}>{stats.audits}</Text>
          <Text style={styles.statLabel}>Audits</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => setActiveTab('checklists')}
        >
          <Text style={styles.statNumber}>{stats.checklists}</Text>
          <Text style={styles.statLabel}>Checklists</Text>
        </TouchableOpacity>

        <View style={[styles.statCard, styles.criticalCard]}>
          <Text style={styles.criticalNumber}>{stats.critical}</Text>
          <Text style={styles.statLabel}>Critical</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quick Access</Text>

      <TouchableOpacity
        style={styles.quickCard}
        onPress={() => setActiveTab('tasks')}
      >
        <View>
          <Text style={styles.quickTitle}>Today's Tasks</Text>
          <Text style={styles.quickSubtitle}>
            Priorities and assignments
          </Text>
        </View>
        <Text style={styles.arrow}>â€º</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.quickCard}
        onPress={() => setActiveTab('audits')}
      >
        <View>
          <Text style={styles.quickTitle}>Audits</Text>
          <Text style={styles.quickSubtitle}>
            Standards, quality and compliance
          </Text>
        </View>
        <Text style={styles.arrow}>â€º</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.quickCard}
        onPress={() => setActiveTab('checklists')}
      >
        <View>
          <Text style={styles.quickTitle}>Checklists</Text>
          <Text style={styles.quickSubtitle}>
            Daily operational routines
          </Text>
        </View>
        <Text style={styles.arrow}>â€º</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.quickCard}
        onPress={() => setActiveTab('more')}
      >
        <View>
          <Text style={styles.quickTitle}>SOP Library</Text>
          <Text style={styles.quickSubtitle}>
            Standards and procedures
          </Text>
        </View>
        <Text style={styles.arrow}>â€º</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const PlaceholderScreen = ({ title, subtitle }) => (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderBrand}>FVH PULSE</Text>

      <Text style={styles.placeholderTitle}>{title}</Text>

      <Text style={styles.placeholderSubtitle}>{subtitle}</Text>

      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderCardText}>
          This section is connected and ready for the next development step.
        </Text>
      </View>
    </View>
  );

  const MoreScreen = () => (
    <ScrollView contentContainerStyle={styles.moreContent}>
      <Text style={styles.placeholderBrand}>FVH PULSE</Text>
      <Text style={styles.placeholderTitle}>More</Text>

      <TouchableOpacity style={styles.moreButton}>
        <Text style={styles.moreButtonText}>SOP Library</Text>
        <Text style={styles.arrow}>â€º</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.moreButton}>
        <Text style={styles.moreButtonText}>Messages</Text>
        <Text style={styles.arrow}>â€º</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.moreButton}>
        <Text style={styles.moreButtonText}>Profile</Text>
        <Text style={styles.arrow}>â€º</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.moreButton}>
        <Text style={styles.moreButtonText}>Report a Problem</Text>
        <Text style={styles.arrow}>â€º</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleSignOut}
      >
        <Text style={styles.logoutText}>SIGN OUT</Text>
      </TouchableOpacity>
    </ScrollView>
  );

const TasksScreen = () => (
  <ScrollView contentContainerStyle={styles.moreContent}>
    <Text style={styles.placeholderBrand}>FVH PULSE</Text>
    <Text style={styles.placeholderTitle}>Tasks</Text>
    <Text style={styles.placeholderSubtitle}>
      Your priorities, assignments and follow-ups.
    </Text>

    <View style={styles.placeholderCard}>
      <Text style={styles.placeholderCardText}>
        Task management is ready for the next development step.
      </Text>
    </View>

    <TouchableOpacity
      style={styles.moreButton}
      onPress={() =>
        Alert.alert(
          'New Task',
          'Task creation will be connected to Supabase next.'
        )
      }
    >
      <Text style={styles.moreButtonText}>+ Create New Task</Text>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.moreButton}>
      <Text style={styles.moreButtonText}>Open Tasks</Text>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.moreButton}>
      <Text style={styles.moreButtonText}>Critical Tasks</Text>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.moreButton}>
      <Text style={styles.moreButtonText}>Completed Tasks</Text>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  </ScrollView>
);

  const renderScreen = () => {
    if (activeTab === 'home') {
      return <HomeScreen />;
    }

if (activeTab === 'tasks') {
  return (
    <ScrollView contentContainerStyle={styles.moreContent}>
      <Text style={styles.placeholderBrand}>FVH PULSE</Text>
      <Text style={styles.placeholderTitle}>Tasks</Text>

      <Text style={styles.placeholderSubtitle}>
        Your priorities, assignments and follow-ups.
      </Text>

      <TouchableOpacity
        style={[styles.moreButton, { backgroundColor: GOLD }]}
        onPress={() =>
          Alert.alert(
            'New Task',
            'Task creation will be connected to Supabase next.'
          )
        }
      >
        <Text style={[styles.moreButtonText, { color: BG }]}>
          + CREATE NEW TASK
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.moreButton}>
        <Text style={styles.moreButtonText}>Open Tasks</Text>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.moreButton}>
        <Text style={styles.moreButtonText}>Critical Tasks</Text>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.moreButton}>
        <Text style={styles.moreButtonText}>Completed Tasks</Text>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

    if (activeTab === 'audits') {
      return (
        <PlaceholderScreen
          title="Audits"
          subtitle="Standards, quality and operational compliance."
        />
      );
    }

    if (activeTab === 'checklists') {
      return (
        <PlaceholderScreen
          title="Checklists"
          subtitle="Daily operating routines and completion."
        />
      );
    }

    return <MoreScreen />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.app}>
        <View style={styles.screen}>{renderScreen()}</View>

        <View style={styles.bottomNav}>
          <NavButton
            title="Home"
            active={activeTab === 'home'}
            onPress={() => setActiveTab('home')}
          />

          <NavButton
            title="Tasks"
            active={activeTab === 'tasks'}
            onPress={() => setActiveTab('tasks')}
          />

          <NavButton
            title="Audits"
            active={activeTab === 'audits'}
            onPress={() => setActiveTab('audits')}
          />

          <NavButton
            title="Checklists"
            active={activeTab === 'checklists'}
            onPress={() => setActiveTab('checklists')}
          />

          <NavButton
            title="More"
            active={activeTab === 'more'}
            onPress={() => setActiveTab('more')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function NavButton({ title, active, onPress }) {
  return (
    <TouchableOpacity style={styles.navButton} onPress={onPress}>
      <View
        style={[
          styles.navDot,
          active && styles.navDotActive,
        ]}
      />

      <Text
        style={[
          styles.navText,
          active && styles.navTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: StatusBar.currentHeight || 0,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingLogo: {
    color: GOLD,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },

  app: {
    flex: 1,
  },

  screen: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 120,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  brand: {
    color: GOLD,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  headerSubtitle: {
    color: MUTED,
    fontSize: 12,
    marginTop: 4,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: BG,
    fontSize: 19,
    fontWeight: '900',
  },

  welcomeBlock: {
    marginTop: 32,
    marginBottom: 26,
  },

  greeting: {
    color: MUTED,
    fontSize: 16,
  },

  personName: {
    color: WHITE,
    fontSize: 30,
    fontWeight: '800',
    marginTop: 3,
  },

  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#172536',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
  },

  roleText: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  commandCenter: {
    backgroundColor: GOLD,
    borderRadius: 22,
    padding: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },

  commandLabel: {
    color: BG,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  commandTitle: {
    color: BG,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 5,
  },

  commandArrow: {
    color: BG,
    fontSize: 35,
    fontWeight: '300',
  },

  sectionTitle: {
    color: WHITE,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
    marginTop: 4,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },

  statCard: {
    flex: 1,
    minHeight: 105,
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
  },

  criticalCard: {
    borderColor: '#603333',
  },

  statNumber: {
    color: GOLD,
    fontSize: 29,
    fontWeight: '900',
  },

  criticalNumber: {
    color: '#E98C8C',
    fontSize: 29,
    fontWeight: '900',
  },

  statLabel: {
    color: MUTED,
    fontSize: 12,
    marginTop: 8,
  },

  quickCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 17,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  quickTitle: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
  },

  quickSubtitle: {
    color: MUTED,
    fontSize: 12,
    marginTop: 4,
  },

  arrow: {
    color: GOLD,
    fontSize: 28,
    fontWeight: '300',
  },

  bottomNav: {
    height: 78,
    backgroundColor: '#0B1624',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 6,
  },

  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'transparent',
    marginBottom: 7,
  },

  navDotActive: {
    backgroundColor: GOLD,
  },

  navText: {
    color: '#687586',
    fontSize: 10,
    fontWeight: '700',
  },

  navTextActive: {
    color: GOLD,
  },

  placeholder: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 32,
  },

  placeholderBrand: {
    color: GOLD,
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 1,
  },

  placeholderTitle: {
    color: WHITE,
    fontSize: 32,
    fontWeight: '800',
    marginTop: 32,
  },

  placeholderSubtitle: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },

  placeholderCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 22,
    marginTop: 28,
    borderWidth: 1,
    borderColor: BORDER,
  },

  placeholderCardText: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
  },

  moreContent: {
    paddingHorizontal: 22,
    paddingTop: 32,
    paddingBottom: 120,
  },

  moreButton: {
    backgroundColor: CARD,
    borderRadius: 16,
    paddingHorizontal: 18,
    minHeight: 60,
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  moreButtonText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '600',
  },

  logoutButton: {
    height: 54,
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 35,
  },

  logoutText: {
    color: GOLD,
    fontWeight: '900',
    letterSpacing: 1,
  },

  loginContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 26,
  },

  logo: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },

  logoText: {
    color: BG,
    fontSize: 22,
    fontWeight: '900',
  },

  title: {
    color: WHITE,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
  },

  tagline: {
    color: MUTED,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 7,
    marginBottom: 36,
  },

  loginCard: {
    backgroundColor: CARD,
    padding: 24,
    borderRadius: 24,
  },

  welcome: {
    color: WHITE,
    fontSize: 23,
    fontWeight: '700',
  },

  description: {
    color: MUTED,
    fontSize: 14,
    marginTop: 6,
    marginBottom: 24,
  },

  label: {
    color: '#D7DEE7',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },

  input: {
    backgroundColor: CARD_2,
    borderWidth: 1,
    borderColor: BORDER,
    color: WHITE,
    borderRadius: 14,
    height: 54,
    paddingHorizontal: 16,
    marginBottom: 18,
    fontSize: 15,
  },

  signInButton: {
    height: 56,
    backgroundColor: GOLD,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  signInButtonText: {
    color: BG,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },

  forgot: {
    color: GOLD,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 13,
  },

  footer: {
    color: '#607083',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 28,
  },
});