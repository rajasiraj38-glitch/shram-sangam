import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

type Mode = 'customer' | 'worker' | 'governance';
type ServiceCard = {
  title: string;
  category: string;
  price: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

const services = [
  { title: 'Emergency pipe repair', category: 'Plumbing', price: 600, icon: 'water-outline' as const, color: '#e9f2ff' },
  { title: 'Fan and switch repair', category: 'Electrical', price: 400, icon: 'flash-outline' as const, color: '#fff2da' },
  { title: 'Elder companion visit', category: 'Caregiving', price: 350, icon: 'heart-outline' as const, color: '#ffe8ec' },
  { title: 'Home deep cleaning', category: 'Cleaning', price: 800, icon: 'home-outline' as const, color: '#e4f5e9' },
];

const proposals = [
  { title: 'Lower cooperative fee from 7% to 5%', detail: 'Return more surplus to working members as the network grows.', yes: 18, no: 4 },
  { title: 'Create a tool replacement grant', detail: 'Use 20% of the mutual aid reserve for verified equipment damage.', yes: 13, no: 2 },
];

function money(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

export default function App() {
  const [mode, setMode] = useState<Mode>('customer');
  const [query, setQuery] = useState('');
  const [online, setOnline] = useState(true);
  const [message, setMessage] = useState('');
  const [votes, setVotes] = useState<Record<number, 'yes' | 'no'>>({});
  const visibleServices = useMemo(() => services.filter((item) => `${item.title} ${item.category}`.toLowerCase().includes(query.toLowerCase())), [query]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>SHRAM SANGAM</Text>
            <Text style={styles.headerSub}>Community-owned services</Text>
          </View>
          <View style={styles.avatar}><Text style={styles.avatarText}>A</Text></View>
        </View>

        <View style={styles.modeBar}>
          <ModeButton active={mode === 'customer'} icon="search-outline" label="Customer" onPress={() => setMode('customer')} />
          <ModeButton active={mode === 'worker'} icon="hammer-outline" label="Worker" onPress={() => setMode('worker')} />
          <ModeButton active={mode === 'governance'} icon="people-outline" label="Assembly" onPress={() => setMode('governance')} />
        </View>

        <Text style={styles.modeLabel}>{mode === 'customer' ? 'CUSTOMER MODE' : mode === 'worker' ? 'WORKER MEMBER MODE' : 'CO-OP ASSEMBLY MODE'}</Text>
        <Text style={styles.title}>{mode === 'customer' ? 'Trusted help, close to home.' : mode === 'worker' ? 'Work on your terms, together.' : 'The people doing the work set the rules.'}</Text>
        <Text style={styles.description}>{mode === 'customer' ? 'Find verified local help and see exactly where your payment goes.' : mode === 'worker' ? 'Manage your availability, find fair work, and grow your cooperative ownership.' : 'Vote on fees, mutual aid, and platform rules with one member, one vote.'}</Text>

        {mode === 'customer' && <CustomerMode query={query} setQuery={setQuery} services={visibleServices} message={message} onBook={setMessage} />}
        {mode === 'worker' && <WorkerMode online={online} setOnline={setOnline} />}
        {mode === 'governance' && <GovernanceMode votes={votes} onVote={(index, decision) => setVotes((current) => ({ ...current, [index]: decision }))} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function ModeButton({ active, icon, label, onPress }: { active: boolean; icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.modeButton, active && styles.modeButtonActive]}><Ionicons name={icon} size={17} color={active ? '#fff' : '#68736e'} /><Text style={[styles.modeButtonText, active && styles.modeButtonTextActive]}>{label}</Text></Pressable>;
}

function CustomerMode({ query, setQuery, services: items, message, onBook }: { query: string; setQuery: (value: string) => void; services: ServiceCard[]; message: string; onBook: (title: string) => void }) {
  return <View>
    <View style={styles.search}><Ionicons name="search-outline" size={19} color="#8b9791" /><TextInput value={query} onChangeText={setQuery} placeholder="Search plumbing, electrical, care..." placeholderTextColor="#9ca7a2" style={styles.searchInput} /></View>
    {message ? <View style={styles.success}><Ionicons name="checkmark-circle" size={20} color="#2f6b4f" /><Text style={styles.successText}>Request sent for {message}</Text></View> : null}
    {items.map((service) => <View key={service.title} style={styles.card}><View style={[styles.serviceIcon, { backgroundColor: service.color }]}><Ionicons name={service.icon} size={24} color="#2f6b4f" /></View><Text style={styles.category}>{service.category.toUpperCase()}</Text><Text style={styles.cardTitle}>{service.title}</Text><View style={styles.cardBottom}><View><Text style={styles.muted}>Starting at</Text><Text style={styles.price}>{money(service.price)}</Text></View><Pressable onPress={() => onBook(service.title)} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Request</Text><Ionicons name="arrow-forward" size={15} color="#fff" /></Pressable></View></View>)}
    <View style={styles.splitCard}><Text style={styles.eyebrowDark}>FAIR RECEIPT</Text><Text style={styles.splitTitle}>Every rupee has a destination.</Text><View style={styles.splitRow}><Split value="90%" label="worker" color="#2f6b4f" /><Split value="7%" label="reserve" color="#d97732" /><Split value="3%" label="mutual aid" color="#c95062" /></View></View>
  </View>;
}

function WorkerMode({ online, setOnline }: { online: boolean; setOnline: (value: boolean) => void }) {
  return <View><View style={styles.card}><Text style={styles.eyebrowDark}>DISPATCH STATUS</Text><Text style={styles.cardTitle}>{online ? 'You are visible for work' : 'You are taking a break'}</Text><Text style={styles.muted}>Fair rotation considers distance and members with fewer jobs.</Text><Pressable onPress={() => setOnline(!online)} style={[styles.primaryButton, { alignSelf: 'flex-start', marginTop: 16, backgroundColor: online ? '#2f6b4f' : '#68736e' }]}><Text style={styles.primaryButtonText}>{online ? 'Online' : 'Go online'}</Text></Pressable></View><View style={styles.statGrid}><Stat value={money(18400)} label="This month" icon="cash-outline" /><Stat value="27" label="Jobs completed" icon="hammer-outline" /><Stat value="1,840" label="Patronage points" icon="sparkles-outline" /></View><View style={styles.card}><View style={styles.rowBetween}><View><Text style={styles.eyebrowDark}>NEARBY OPPORTUNITY</Text><Text style={styles.cardTitle}>Ceiling fan repair</Text></View><Text style={styles.distance}>2.4 km</Text></View><Text style={styles.muted}>HSR Layout · Today, 4:30 PM</Text><View style={styles.jobFooter}><Text style={styles.price}>{money(360)} payout</Text><Pressable style={styles.primaryButton}><Text style={styles.primaryButtonText}>Review job</Text></Pressable></View></View></View>;
}

function GovernanceMode({ votes, onVote }: { votes: Record<number, 'yes' | 'no'>; onVote: (index: number, decision: 'yes' | 'no') => void }) {
  return <View><View style={styles.statGrid}><Stat value="2" label="Active proposals" icon="megaphone-outline" /><Stat value="76%" label="Quorum reached" icon="bar-chart-outline" /><Stat value={money(2065)} label="Reserve balance" icon="wallet-outline" /></View>{proposals.map((proposal, index) => { const total = proposal.yes + proposal.no; return <View style={styles.card} key={proposal.title}><Text style={styles.eyebrowDark}>ACTIVE PROPOSAL</Text><Text style={styles.cardTitle}>{proposal.title}</Text><Text style={styles.muted}>{proposal.detail}</Text><View style={styles.progressTrack}><View style={[styles.progress, { width: `${(proposal.yes / total) * 100}%` }]} /></View><Text style={styles.voteCount}>{Math.round((proposal.yes / total) * 100)}% yes · {total} votes</Text><View style={styles.voteRow}><Pressable onPress={() => onVote(index, 'yes')} style={[styles.voteButton, votes[index] === 'yes' && styles.voteYes]}><Text style={[styles.voteText, votes[index] === 'yes' && styles.voteTextActive]}>Vote yes</Text></Pressable><Pressable onPress={() => onVote(index, 'no')} style={[styles.voteButton, votes[index] === 'no' && styles.voteNo]}><Text style={[styles.voteText, votes[index] === 'no' && styles.voteTextActive]}>Vote no</Text></Pressable></View></View>; })}</View>;
}

function Stat({ value, label, icon }: { value: string; label: string; icon: keyof typeof Ionicons.glyphMap }) { return <View style={styles.stat}><Ionicons name={icon} size={20} color="#2f6b4f" /><Text style={styles.statValue}>{value}</Text><Text style={styles.muted}>{label}</Text></View>; }
function Split({ value, label, color }: { value: string; label: string; color: string }) { return <View style={styles.split}><Text style={[styles.splitValue, { color }]}>{value}</Text><Text style={styles.muted}>{label}</Text></View>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f5ee' },
  content: { padding: 20, paddingBottom: 40 },
  header: { backgroundColor: '#17231f', margin: -20, marginBottom: 18, padding: 20, paddingTop: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: '#dcebdc', fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  eyebrowDark: { color: '#2f6b4f', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  headerSub: { color: '#aebbb4', marginTop: 5, fontSize: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#d97732', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  modeBar: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 4, marginBottom: 26, borderWidth: 1, borderColor: '#e8e8e2' },
  modeButton: { flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: 'center', gap: 4 },
  modeButtonActive: { backgroundColor: '#17231f' },
  modeButtonText: { color: '#68736e', fontSize: 11, fontWeight: '700' },
  modeButtonTextActive: { color: '#fff' },
  modeLabel: { color: '#2f6b4f', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: '#17231f', fontSize: 32, lineHeight: 38, fontWeight: '800', marginTop: 8 },
  description: { color: '#68736e', fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 24 },
  search: { backgroundColor: '#fff', borderRadius: 15, paddingHorizontal: 14, height: 50, flexDirection: 'row', alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: '#e8e8e2' },
  searchInput: { flex: 1, color: '#17231f', marginLeft: 10, fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 17, marginBottom: 14, borderWidth: 1, borderColor: '#e8e8e2' },
  serviceIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  category: { color: '#8b9791', fontSize: 10, fontWeight: '800', letterSpacing: 1.3 },
  cardTitle: { color: '#17231f', fontSize: 18, fontWeight: '800', marginTop: 6, lineHeight: 23 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20 },
  muted: { color: '#7d8983', fontSize: 12, lineHeight: 18 },
  price: { color: '#d97732', fontSize: 19, fontWeight: '800', marginTop: 3 },
  primaryButton: { backgroundColor: '#17231f', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', gap: 6, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  splitCard: { backgroundColor: '#dcebdc', borderRadius: 18, padding: 18, marginTop: 4 },
  splitTitle: { color: '#17231f', fontSize: 17, fontWeight: '800', marginTop: 5 },
  splitRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  split: { alignItems: 'center' },
  splitValue: { fontSize: 20, fontWeight: '800' },
  success: { backgroundColor: '#e4f5e9', borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  successText: { color: '#2f6b4f', fontSize: 13, flex: 1 },
  statGrid: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  stat: { backgroundColor: '#fff', borderRadius: 16, padding: 13, flex: 1, minHeight: 105, borderWidth: 1, borderColor: '#e8e8e2' },
  statValue: { color: '#17231f', fontSize: 19, fontWeight: '800', marginTop: 13 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  distance: { color: '#2f6b4f', backgroundColor: '#e4f5e9', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, fontSize: 11, fontWeight: '800' },
  jobFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#edf0eb', marginTop: 16, paddingTop: 14 },
  progressTrack: { height: 8, backgroundColor: '#f6dfe3', borderRadius: 8, overflow: 'hidden', marginTop: 20 },
  progress: { height: 8, backgroundColor: '#2f6b4f', borderRadius: 8 },
  voteCount: { color: '#7d8983', fontSize: 11, marginTop: 7 },
  voteRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  voteButton: { borderRadius: 11, paddingVertical: 10, paddingHorizontal: 18, backgroundColor: '#dcebdc' },
  voteYes: { backgroundColor: '#2f6b4f' },
  voteNo: { backgroundColor: '#c95062' },
  voteText: { color: '#2f6b4f', fontWeight: '800', fontSize: 12 },
  voteTextActive: { color: '#fff' },
});
