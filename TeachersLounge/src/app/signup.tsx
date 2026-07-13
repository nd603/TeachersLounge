import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TLColors } from '@/constants/theme';
import { ALLOWED_EMAILS } from '@/config/allowedEmails';
import { supabase } from '@/lib/supabase';

const TOTAL_STEPS = 6;

const ALL_TOPICS = [
  { id: 'mental-health', label: 'Mental Health' },
  { id: 'free-resources', label: 'Free Resources' },
  { id: 'administration', label: 'Administration' },
  { id: 'funny', label: 'Funny' },
  { id: 'parents', label: 'Parents' },
  { id: 'mentorship', label: 'Mentorship Advice' },
  { id: 'class-mgmt', label: 'Class Management' },
  { id: 'career', label: 'Career Advice' },
  { id: 'ann-arbor', label: 'Ann Arbor Teachers', section: 'Topics based on location' },
  { id: 'michigan', label: 'Michigan Teachers', section: '' },
  { id: 'first-year', label: 'First Year Teachers', section: 'Topics based on experience level' },
  { id: 'new-teachers', label: 'New Teachers', section: '' },
  { id: '7th-grade', label: '7th Grade', section: 'Topics based on grade level' },
  { id: 'social-studies', label: 'Social Studies Teachers', section: 'Topics based on subject' },
];

export default function SignupScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [yearsTeaching, setYearsTeaching] = useState('');
  const [verifyCode, setVerifyCode] = useState('');

  const [locationEnabled, setLocationEnabled] = useState(true);
  const [recommendEnabled, setRecommendEnabled] = useState(true);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['first-year']);

  const goNext = async () => {
    if (step === 1) {
      if (!firstName || !lastName || !email || !password) {
        Alert.alert('Missing fields', 'Please fill in all required fields.');
        return;
      }
      if (!email.endsWith('.edu') && !ALLOWED_EMAILS.includes(email)) {
        Alert.alert('Invalid email', 'Please use a .edu email address.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Password mismatch', 'Passwords do not match.');
        return;
      }
      if (password.length < 8) {
        Alert.alert('Weak password', 'Password must be at least 8 characters.');
        return;
      }
      setLoading(true);
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { first_name: firstName, last_name: lastName } },
        });
        if (error) { Alert.alert('Sign up error', error.message); setLoading(false); return; }
      } catch (e: any) {
        Alert.alert('Sign up error', e?.message ?? 'Something went wrong. Check your connection.');
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    if (step < TOTAL_STEPS) setStep(step + 1);
    else router.replace('/(tabs)/home');
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const toggleTopic = (id: string) => {
    setSelectedTopics(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const progress = step / TOTAL_STEPS;

  return (
    <SafeAreaView style={styles.container}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={goBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* STEP 1 - Personal Info */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Sign Up</Text>
            <Field label="First Name*" value={firstName} onChangeText={setFirstName} placeholder="First name" />
            <Field label="Middle Name" placeholder="Enter your middle name" />
            <Field label="Last Name*" value={lastName} onChangeText={setLastName} placeholder="Last name" />
            <Field label="Education Email (.edu)*" value={email} onChangeText={setEmail} placeholder="user@school.edu" keyboardType="email-address" />
            <Field label="Password*" value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry hint="Must be at least 8 characters." />
            <Field label="Re-enter Password*" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter password" secureTextEntry />
            <CheckRow label="I read and agree to the privacy policy" defaultChecked />
            <CheckRow label="I read and agree to the community guidelines" defaultChecked />
          </View>
        )}

        {/* STEP 2 - School Info */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Sign Up</Text>
            <Field label="Your School Name*" value="West Valley Middle School" />
            <View style={styles.field}>
              <Text style={styles.label}>Subjects You Teach</Text>
              <View style={styles.tagField}>
                <View style={styles.tag}><Text style={styles.tagText}>Social Studies ×</Text></View>
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Grade Levels You Teach*</Text>
              <View style={styles.tagField}>
                <View style={styles.tag}><Text style={styles.tagText}>7th ×</Text></View>
              </View>
            </View>
            <Field label="How Many Years Have You Been Teaching?" value="1" keyboardType="numeric" />
          </View>
        )}

        {/* STEP 3 - Verify Email */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>Verify Your Email</Text>
            <Text style={styles.bodyText}>
              A 6-digit verification code has been sent to{' '}
              <Text style={styles.bold}>user@school.edu</Text>
            </Text>
            <Text style={[styles.bodyText, { marginTop: 8, marginBottom: 20 }]}>
              If you don't see the email within a minute, be sure to{' '}
              <Text style={styles.link}>check your spam folder</Text>.
            </Text>
            <Field value="123456" keyboardType="numeric" />
            <TouchableOpacity style={styles.btnResend}>
              <Text style={styles.btnResendText}>Resend Code</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 4 - Profile Settings */}
        {step === 4 && (
          <View>
            <Text style={styles.stepTitle}>Basic Profile Settings</Text>
            <Text style={[styles.bodyText, { marginBottom: 20 }]}>
              Choose your profile settings below. These can be changed anytime.
            </Text>
            <ToggleRow
              label="Allow access to your location to connect you with teacher communities near you"
              value={locationEnabled}
              onToggle={setLocationEnabled}
            />
            <ToggleRow
              label="Recommend your profile to others, based on engagement and similar interests"
              value={recommendEnabled}
              onToggle={setRecommendEnabled}
            />
            <ToggleRow
              label="Make profile private"
              value={privateProfile}
              onToggle={setPrivateProfile}
            />
          </View>
        )}

        {/* STEP 5 - Topics */}
        {step === 5 && (
          <View>
            <Text style={styles.stepTitle}>Topics For You</Text>
            <Text style={[styles.bodyText, { marginBottom: 4 }]}>
              Select topics you're interested in. These can be adjusted later.
            </Text>
            <Text style={styles.selectedCount}>{selectedTopics.length}/{ALL_TOPICS.length} selected</Text>

            <View style={styles.pillsWrap}>
              {ALL_TOPICS.filter(t => !t.section).map(topic => (
                <TouchableOpacity
                  key={topic.id}
                  style={[styles.pill, selectedTopics.includes(topic.id) && styles.pillSelected]}
                  onPress={() => toggleTopic(topic.id)}>
                  <Text style={[styles.pillText, selectedTopics.includes(topic.id) && styles.pillTextSelected]}>
                    {topic.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {['Topics based on location', 'Topics based on experience level', 'Topics based on grade level', 'Topics based on subject'].map(section => (
              <View key={section} style={{ marginTop: 16 }}>
                <Text style={styles.sectionLabel}>{section}</Text>
                <View style={styles.pillsWrap}>
                  {ALL_TOPICS.filter(t => t.section === section).map(topic => (
                    <TouchableOpacity
                      key={topic.id}
                      style={[styles.pill, selectedTopics.includes(topic.id) && styles.pillSelected]}
                      onPress={() => toggleTopic(topic.id)}>
                      <Text style={[styles.pillText, selectedTopics.includes(topic.id) && styles.pillTextSelected]}>
                        {topic.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* STEP 6 - Welcome */}
        {step === 6 && (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Welcome!</Text>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>☕</Text>
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Next Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.btnNext, loading && { opacity: 0.6 }]} onPress={goNext} disabled={loading}>
          <Text style={styles.btnNextText}>
            {loading ? 'Please wait…' : step === TOTAL_STEPS ? "Explore Teachers' Lounge →" : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, placeholder, hint, secureTextEntry, keyboardType }: any) {
  return (
    <View style={styles.field}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="none"
      />
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

function CheckRow({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked ?? false);
  return (
    <TouchableOpacity style={styles.checkRow} onPress={() => setChecked(!checked)}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ToggleRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={[styles.label, { flex: 1 }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#ccc', true: TLColors.primary }}
        thumbColor={TLColors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TLColors.white },
  nav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, gap: 12 },
  backText: { fontSize: 24, color: TLColors.black },
  progressTrack: { flex: 1, height: 6, backgroundColor: TLColors.gray200, borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: TLColors.primary, borderRadius: 3 },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  stepTitle: { fontSize: 22, fontWeight: '700', marginBottom: 20, color: TLColors.black },
  field: { marginBottom: 14 },
  label: { fontSize: 13, color: TLColors.gray700, marginBottom: 5 },
  input: {
    borderWidth: 1.5, borderColor: TLColors.gray300, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
  },
  hint: { fontSize: 12, color: TLColors.gray500, marginTop: 4 },
  tagField: {
    borderWidth: 1.5, borderColor: TLColors.gray300, borderRadius: 10,
    padding: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 6, minHeight: 46,
  },
  tag: { backgroundColor: TLColors.primary, borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { color: TLColors.white, fontSize: 13 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  checkbox: {
    width: 20, height: 20, borderWidth: 1.5, borderColor: TLColors.gray300,
    borderRadius: 4, alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: TLColors.primary, borderColor: TLColors.primary },
  checkmark: { color: TLColors.white, fontSize: 12, fontWeight: '700' },
  checkLabel: { fontSize: 13, color: TLColors.gray700, flex: 1 },
  bodyText: { fontSize: 14, color: TLColors.gray700, lineHeight: 20 },
  bold: { fontWeight: '700', color: TLColors.black },
  link: { color: TLColors.primary, fontWeight: '600' },
  btnResend: {
    borderWidth: 1.5, borderColor: TLColors.gray300, borderRadius: 50,
    paddingVertical: 8, paddingHorizontal: 18, alignSelf: 'flex-start', marginTop: 10,
  },
  btnResendText: { fontSize: 14, color: TLColors.gray700 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: TLColors.border, gap: 16,
  },
  selectedCount: { fontSize: 13, color: TLColors.primary, fontWeight: '600', textAlign: 'right', marginBottom: 12 },
  pillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    borderWidth: 1.5, borderColor: TLColors.gray300, borderRadius: 50,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  pillSelected: { backgroundColor: TLColors.danger, borderColor: TLColors.danger },
  pillText: { fontSize: 13, color: TLColors.black },
  pillTextSelected: { color: TLColors.white },
  sectionLabel: { fontSize: 12, color: TLColors.gray500, marginBottom: 8 },
  welcomeContainer: { alignItems: 'center', paddingTop: 60 },
  welcomeTitle: { fontSize: 32, fontWeight: '700', marginBottom: 32, color: TLColors.black },
  logoCircle: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: TLColors.gray100, alignItems: 'center', justifyContent: 'center',
  },
  logoEmoji: { fontSize: 64 },
  footer: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8 },
  btnNext: {
    backgroundColor: TLColors.primary, borderRadius: 50,
    paddingVertical: 16, alignItems: 'center',
  },
  btnNextText: { color: TLColors.white, fontSize: 16, fontWeight: '600' },
});
