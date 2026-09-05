import { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

const logo = require("./assets/shram-sangam-logo.jpeg");

type Mode = "customer" | "worker" | "company";
type Role = "customer" | "worker" | "company";
type OnboardingData = {
  username: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  role: Role;
  category: string;
  selectedServices: string[];
  organization: string;
};
type ServiceCard = {
  title: string;
  category: string;
  price: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

const services = [
  {
    title: "Emergency pipe repair",
    category: "Plumbing",
    price: 600,
    icon: "water-outline" as const,
    color: "#e9f2ff",
  },
  {
    title: "Fan and switch repair",
    category: "Electrical",
    price: 400,
    icon: "flash-outline" as const,
    color: "#fff2da",
  },
  {
    title: "Elder companion visit",
    category: "Caregiving",
    price: 350,
    icon: "heart-outline" as const,
    color: "#ffe8ec",
  },
  {
    title: "Home deep cleaning",
    category: "Cleaning",
    price: 800,
    icon: "home-outline" as const,
    color: "#e4f5e9",
  },
];

const proposals = [
  {
    title: "Lower cooperative fee from 7% to 5%",
    detail: "Return more surplus to working members as the network grows.",
    yes: 18,
    no: 4,
  },
  {
    title: "Create a tool replacement grant",
    detail: "Use 20% of the mutual aid reserve for verified equipment damage.",
    yes: 13,
    no: 2,
  },
];

function money(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function App() {
  const [onboarded, setOnboarded] = useState(false);
  const [mode, setMode] = useState<Mode>("customer");
  const [query, setQuery] = useState("");
  const [online, setOnline] = useState(true);
  const [message, setMessage] = useState("");
  const [votes, setVotes] = useState<Record<number, "yes" | "no">>({});
  const visibleServices = useMemo(
    () =>
      services.filter((item) =>
        `${item.title} ${item.category}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  );

  if (!onboarded) {
    return (
      <Onboarding
        onComplete={(data) => {
          setMode(data.role);
          setOnboarded(true);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerGlowOne} />
          <View style={styles.headerGlowTwo} />
          <View style={styles.headerBrand}>
            <View style={styles.headerLogoFrame}>
              <Image
                source={logo}
                style={styles.headerLogo}
                resizeMode="cover"
              />
            </View>
            <View>
              <Text style={styles.headerWordmark}>SHRAM SANGAM</Text>
              <Text style={styles.headerSub}>Community-owned services</Text>
            </View>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
        </View>

        <View style={styles.modeBar}>
          <ModeButton
            active={mode === "customer"}
            icon="search-outline"
            label="Customer"
            onPress={() => setMode("customer")}
          />
          <ModeButton
            active={mode === "worker"}
            icon="hammer-outline"
            label="Worker"
            onPress={() => setMode("worker")}
          />
          <ModeButton
            active={mode === "company"}
            icon="business-outline"
            label="Company"
            onPress={() => setMode("company")}
          />
        </View>

        <Text style={styles.modeLabel}>
          {mode === "customer"
            ? "CUSTOMER MODE"
            : mode === "worker"
              ? "WORKER MEMBER MODE"
              : "COMPANY MODE"}
        </Text>
        <Text style={styles.title}>
          {mode === "customer"
            ? "Trusted help, close to home."
            : mode === "worker"
              ? "Work on your terms, together."
              : "Build a better service team."}
        </Text>
        <Text style={styles.description}>
          {mode === "customer"
            ? "Find verified local help and see exactly where your payment goes."
            : mode === "worker"
              ? "Manage your availability, find fair work, and grow your cooperative ownership."
              : "Manage your company, find skilled workers, and coordinate service requests."}
        </Text>

        {mode === "customer" && (
          <CustomerMode
            query={query}
            setQuery={setQuery}
            services={visibleServices}
            message={message}
            onBook={setMessage}
          />
        )}
        {mode === "worker" && (
          <WorkerMode online={online} setOnline={setOnline} />
        )}
        {mode === "company" && <CompanyMode />}
      </ScrollView>
    </SafeAreaView>
  );
}

function ModeButton({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.modeButton, active && styles.modeButtonActive]}
    >
      <Ionicons name={icon} size={17} color={active ? "#fff" : "#46556B"} />
      <Text
        style={[styles.modeButtonText, active && styles.modeButtonTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const roleOptions: {
  role: Role;
  title: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    role: "customer",
    title: "Customer",
    detail: "Book trusted help for your home or community.",
    icon: "search-outline",
  },
  {
    role: "worker",
    title: "Worker",
    detail: "Find fair work and grow your independent practice.",
    icon: "hammer-outline",
  },
  {
    role: "company",
    title: "Company",
    detail: "Manage a service business and your team.",
    icon: "business-outline",
  },
];

const workerCategories = [
  "Plumber",
  "Electrician",
  "Carpenter",
  "Craftsman",
  "Cleaner",
  "Caregiver",
  "Painter",
  "Other trade",
];
const companyCategories = [
  "Home services",
  "Construction",
  "Cleaning services",
  "Electrical services",
  "Plumbing services",
  "Care services",
  "Other company",
];
const customerCategories = [
  "Plumbing",
  "Electrical",
  "Cleaning",
  "Caregiving",
  "Carpentry",
  "Painting",
  "Appliance repair",
  "Moving help",
  "Other service",
];
const indiaRegions = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

function Onboarding({
  onComplete,
}: {
  onComplete: (data: OnboardingData) => void;
}) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [locationBusy, setLocationBusy] = useState(false);
  const [showRegions, setShowRegions] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    username: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    role: "customer",
    category: "",
    selectedServices: [],
    organization: "",
  });
  const update = (field: keyof OnboardingData, value: string) =>
    setData((current) => ({ ...current, [field]: value }));
  const categories =
    data.role === "customer"
      ? customerCategories
      : data.role === "worker"
        ? workerCategories
        : companyCategories;

  function toggleService(service: string) {
    setData((current) => ({
      ...current,
      selectedServices: current.selectedServices.includes(service)
        ? current.selectedServices.filter((item) => item !== service)
        : [...current.selectedServices, service],
    }));
  }

  async function useCurrentLocation() {
    setError("");
    setLocationBusy(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setError(
          "Location permission was not granted. You can enter your address manually.",
        );
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const places = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const place = places[0];
      const address = [
        place?.name,
        place?.street,
        place?.district,
        place?.city,
        place?.region,
      ]
        .filter(Boolean)
        .filter((value, index, values) => values.indexOf(value) === index)
        .join(", ");
      if (address) update("address", address);
      if (place?.city) update("city", place.city);
      if (place?.region && indiaRegions.includes(place.region))
        update("state", place.region);
    } catch {
      setError(
        "We could not read your current location. Please enter your address manually.",
      );
    } finally {
      setLocationBusy(false);
    }
  }

  function next() {
    const message =
      step === 0 &&
      (!data.username ||
        data.password.length < 6 ||
        data.password !== data.confirmPassword)
        ? "Enter a username and a matching password of at least 6 characters."
        : step === 1 &&
            (!data.fullName ||
              !data.phone ||
              !data.gender ||
              !data.address ||
              !data.city ||
              !data.state)
          ? "Complete all personal details before continuing."
          : step === 2 && !data.role
            ? "Choose how you want to use Shram Sangam."
            : step === 3 &&
                ((data.role === "customer" &&
                  data.selectedServices.length === 0) ||
                  (data.role !== "customer" &&
                    (!data.category ||
                      (data.role === "company" && !data.organization))))
              ? "Choose a category and complete the requested detail."
              : "";
    if (message) {
      setError(message);
      return;
    }
    setError("");
    if (step === 3) onComplete(data);
    else setStep((current) => current + 1);
  }

  return (
    <SafeAreaView style={styles.onboardingSafe}>
      <ScrollView
        contentContainerStyle={styles.onboardingContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.onboardingBrand}>
          <View pointerEvents="none" style={styles.brandDeckShadow} />
          <View pointerEvents="none" style={styles.brandDeckBase} />
          <View pointerEvents="none" style={styles.brandDeckTop} />
          <View style={styles.brandOrbitLarge} />
          <View style={styles.brandOrbitSmall} />
          <View style={styles.onboardingLogoFrame}>
            <Image
              source={logo}
              style={styles.onboardingLogo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.brandCaption}>
            <View style={styles.brandCaptionLine} />
            <Text style={styles.brandCaptionText}>
              COOPERATIVE GIG SERVICES
            </Text>
            <View style={styles.brandCaptionLine} />
          </View>
        </View>
        <Text style={styles.onboardingKicker}>
          WELCOME · STEP {step + 1} OF 4
        </Text>
        <Text style={styles.onboardingTitle}>
          {step === 0
            ? "Create your account."
            : step === 1
              ? "Tell us about you."
              : step === 2
                ? "How will you participate?"
                : data.role === "worker"
                  ? "What work do you do?"
                  : data.role === "company"
                    ? "What kind of company is this?"
                    : "You are ready to find help."}
        </Text>
        <Text style={styles.onboardingDescription}>
          {step === 0
            ? "Start with a secure username and password."
            : step === 1
              ? "These details help us make your local experience useful."
              : step === 2
                ? "You can switch between roles later from your profile."
                : data.role === "customer"
                  ? "Confirm your details and start browsing verified services."
                  : "Choose the category that best describes your work."}
        </Text>

        <View style={styles.stepTrack}>
          {[0, 1, 2, 3].map((item) => (
            <View
              key={item}
              style={[styles.stepDot, item <= step && styles.stepDotActive]}
            />
          ))}
        </View>

        {step === 0 && (
          <View>
            <Field
              label="Username"
              value={data.username}
              onChangeText={(value) => update("username", value)}
              placeholder="Choose a username"
              autoCapitalize="none"
            />
            <Field
              label="Password"
              value={data.password}
              onChangeText={(value) => update("password", value)}
              placeholder="At least 6 characters"
              secureTextEntry
            />
            <Field
              label="Confirm password"
              value={data.confirmPassword}
              onChangeText={(value) => update("confirmPassword", value)}
              placeholder="Repeat your password"
              secureTextEntry
            />
          </View>
        )}
        {step === 1 && (
          <View>
            <Field
              label="Full name"
              value={data.fullName}
              onChangeText={(value) => update("fullName", value)}
              placeholder="Your name"
            />
            <Field
              label="Phone number"
              value={data.phone}
              onChangeText={(value) => update("phone", value)}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
            />
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.choiceRow}>
              {["Woman", "Man", "Non-binary", "Prefer not to say"].map(
                (value) => (
                  <Choice
                    key={value}
                    label={value}
                    active={data.gender === value}
                    onPress={() => update("gender", value)}
                  />
                ),
              )}
            </View>
            <Field
              label="Address"
              value={data.address}
              onChangeText={(value) => update("address", value)}
              placeholder="House number, street, area"
              multiline
            />
            <Pressable
              onPress={useCurrentLocation}
              disabled={locationBusy}
              style={styles.locationButton}
            >
              <Ionicons
                name={locationBusy ? "hourglass-outline" : "locate-outline"}
                size={17}
                color="#FF6B00"
              />
              <Text style={styles.locationButtonText}>
                {locationBusy
                  ? "Finding your location..."
                  : "Use current location"}
              </Text>
            </Pressable>
            <RegionSelect
              value={data.state}
              open={showRegions}
              onToggle={() => setShowRegions((current) => !current)}
              onSelect={(region) => {
                update("state", region);
                setShowRegions(false);
              }}
            />
            <Field
              label="City"
              value={data.city}
              onChangeText={(value) => update("city", value)}
              placeholder={data.state ? "Your city" : "Select a state first"}
              disabled={!data.state}
            />
          </View>
        )}
        {step === 2 && (
          <View style={styles.roleList}>
            {roleOptions.map((option) => (
              <Pressable
                key={option.role}
                onPress={() => update("role", option.role)}
                style={[
                  styles.roleCard,
                  data.role === option.role && styles.roleCardActive,
                ]}
              >
                <View
                  style={[
                    styles.roleIcon,
                    data.role === option.role && styles.roleIconActive,
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={22}
                    color={data.role === option.role ? "#fff" : "#164B7A"}
                  />
                </View>
                <View style={styles.roleCopy}>
                  <Text
                    style={[
                      styles.roleTitle,
                      data.role === option.role && styles.roleTitleActive,
                    ]}
                  >
                    {option.title}
                  </Text>
                  <Text
                    style={[
                      styles.roleDetail,
                      data.role === option.role && styles.roleDetailActive,
                    ]}
                  >
                    {option.detail}
                  </Text>
                </View>
                <Ionicons
                  name={
                    data.role === option.role
                      ? "checkmark-circle"
                      : "ellipse-outline"
                  }
                  size={22}
                  color={data.role === option.role ? "#FF6B00" : "#A9C9EB"}
                />
              </Pressable>
            ))}
          </View>
        )}
        {step === 3 && (
          <View>
            <Text style={styles.fieldLabel}>
              {data.role === "customer"
                ? "What are you looking for?"
                : "Category"}
            </Text>
            {data.role === "customer" && (
              <Text style={styles.onboardingHint}>
                Choose one or more services.
              </Text>
            )}
            <View style={styles.choiceGrid}>
              {categories.map((value) => (
                <Choice
                  key={value}
                  label={value}
                  active={
                    data.role === "customer"
                      ? data.selectedServices.includes(value)
                      : data.category === value
                  }
                  onPress={() =>
                    data.role === "customer"
                      ? toggleService(value)
                      : update("category", value)
                  }
                />
              ))}
            </View>
            {data.role === "company" && (
              <Field
                label="Company name"
                value={data.organization}
                onChangeText={(value) => update("organization", value)}
                placeholder="Registered or trading name"
              />
            )}
          </View>
        )}

        {error ? (
          <View style={styles.formError}>
            <Ionicons name="alert-circle-outline" size={18} color="#c95062" />
            <Text style={styles.formErrorText}>{error}</Text>
          </View>
        ) : null}
        <View style={styles.onboardingActions}>
          {step > 0 && (
            <Pressable
              onPress={() => {
                setError("");
                setStep((current) => current - 1);
              }}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
          )}
          <Pressable onPress={next} style={styles.continueButton}>
            <Text style={styles.continueButtonText}>
              {step === 3 ? "Enter Shram Sangam" : "Continue"}
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#102746" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize,
  keyboardType,
  multiline,
  disabled,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences";
  keyboardType?: "default" | "phone-pad";
  multiline?: boolean;
  disabled?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldInputShell}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#D4E0F0"
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          multiline={multiline}
          editable={!disabled}
          style={[
            styles.fieldInput,
            multiline && styles.fieldInputMultiline,
            disabled && styles.fieldInputDisabled,
          ]}
        />
      </View>
    </View>
  );
}

function RegionSelect({
  value,
  open,
  onToggle,
  onSelect,
}: {
  value: string;
  open: boolean;
  onToggle: () => void;
  onSelect: (region: string) => void;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>State or Union Territory</Text>
      <Pressable onPress={onToggle} style={styles.regionSelect}>
        <Text
          style={value ? styles.regionSelectText : styles.regionPlaceholder}
        >
          {value || "Select your state or Union Territory"}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color="#F8F8FF"
        />
      </Pressable>
      {open && (
        <View style={styles.regionList}>
          {indiaRegions.map((region) => (
            <Pressable
              key={region}
              onPress={() => onSelect(region)}
              style={[
                styles.regionOption,
                value === region && styles.regionOptionActive,
              ]}
            >
              <Text
                style={[
                  styles.regionOptionText,
                  value === region && styles.regionOptionTextActive,
                ]}
              >
                {region}
              </Text>
              {value === region && (
                <Ionicons name="checkmark" size={17} color="#FF6B00" />
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function Choice({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.choice, active && styles.choiceActive]}
    >
      <Text style={[styles.choiceText, active && styles.choiceTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function CustomerMode({
  query,
  setQuery,
  services: items,
  message,
  onBook,
}: {
  query: string;
  setQuery: (value: string) => void;
  services: ServiceCard[];
  message: string;
  onBook: (title: string) => void;
}) {
  return (
    <View>
      <View style={styles.search}>
        <Ionicons name="search-outline" size={19} color="#8b9791" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search plumbing, electrical, care..."
          placeholderTextColor="#A9B8CC"
          style={styles.searchInput}
        />
      </View>
      {message ? (
        <View style={styles.success}>
          <Ionicons name="checkmark-circle" size={20} color="#1F6FB2" />
          <Text style={styles.successText}>Request sent for {message}</Text>
        </View>
      ) : null}
      {items.map((service) => (
        <View key={service.title} style={styles.card}>
          <View
            style={[styles.serviceIcon, { backgroundColor: service.color }]}
          >
            <Ionicons name={service.icon} size={24} color="#164B7A" />
          </View>
          <Text style={styles.category}>{service.category.toUpperCase()}</Text>
          <Text style={styles.cardTitle}>{service.title}</Text>
          <View style={styles.cardBottom}>
            <View>
              <Text style={styles.muted}>Starting at</Text>
              <Text style={styles.price}>{money(service.price)}</Text>
            </View>
            <Pressable
              onPress={() => onBook(service.title)}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Request</Text>
              <Ionicons name="arrow-forward" size={15} color="#fff" />
            </Pressable>
          </View>
        </View>
      ))}
      <View style={styles.splitCard}>
        <Text style={styles.eyebrowDark}>FAIR RECEIPT</Text>
        <Text style={styles.splitTitle}>Every rupee has a destination.</Text>
        <View style={styles.splitRow}>
          <Split value="90%" label="worker" color="#164B7A" />
          <Split value="7%" label="reserve" color="#C85A13" />
          <Split value="3%" label="mutual aid" color="#c95062" />
        </View>
      </View>
    </View>
  );
}

function WorkerMode({
  online,
  setOnline,
}: {
  online: boolean;
  setOnline: (value: boolean) => void;
}) {
  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.eyebrowDark}>DISPATCH STATUS</Text>
        <Text style={styles.cardTitle}>
          {online ? "You are visible for work" : "You are taking a break"}
        </Text>
        <Text style={styles.muted}>
          Fair rotation considers distance and members with fewer jobs.
        </Text>
        <Pressable
          onPress={() => setOnline(!online)}
          style={[
            styles.primaryButton,
            {
              alignSelf: "flex-start",
              marginTop: 16,
              backgroundColor: online ? "#1F6FB2" : "#718096",
            },
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {online ? "Online" : "Go online"}
          </Text>
        </Pressable>
      </View>
      <View style={styles.statGrid}>
        <Stat value={money(18400)} label="This month" icon="cash-outline" />
        <Stat value="27" label="Jobs completed" icon="hammer-outline" />
        <Stat value="1,840" label="Patronage points" icon="sparkles-outline" />
      </View>
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.eyebrowDark}>NEARBY OPPORTUNITY</Text>
            <Text style={styles.cardTitle}>Ceiling fan repair</Text>
          </View>
          <Text style={styles.distance}>2.4 km</Text>
        </View>
        <Text style={styles.muted}>HSR Layout · Today, 4:30 PM</Text>
        <View style={styles.jobFooter}>
          <Text style={styles.price}>{money(360)} payout</Text>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Review job</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function CompanyMode() {
  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.eyebrowDark}>COMPANY SNAPSHOT</Text>
        <Text style={styles.cardTitle}>Your service desk is ready.</Text>
        <Text style={styles.muted}>
          Review incoming requests, coordinate your team, and keep every payout
          transparent.
        </Text>
        <View style={styles.companyActions}>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>View requests</Text>
            <Ionicons name="arrow-forward" size={15} color="#fff" />
          </Pressable>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Invite worker</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.statGrid}>
        <Stat value="12" label="Active requests" icon="briefcase-outline" />
        <Stat value="8" label="Team members" icon="people-outline" />
        <Stat value="₹42,600" label="This month" icon="cash-outline" />
      </View>
      <View style={styles.card}>
        <Text style={styles.eyebrowDark}>TEAM CATEGORY</Text>
        <Text style={styles.cardTitle}>Home services network</Text>
        <Text style={styles.muted}>
          Your company profile can add more categories and service areas from
          settings.
        </Text>
      </View>
    </View>
  );
}

function GovernanceMode({
  votes,
  onVote,
}: {
  votes: Record<number, "yes" | "no">;
  onVote: (index: number, decision: "yes" | "no") => void;
}) {
  return (
    <View>
      <View style={styles.statGrid}>
        <Stat value="2" label="Active proposals" icon="megaphone-outline" />
        <Stat value="76%" label="Quorum reached" icon="bar-chart-outline" />
        <Stat
          value={money(2065)}
          label="Reserve balance"
          icon="wallet-outline"
        />
      </View>
      {proposals.map((proposal, index) => {
        const total = proposal.yes + proposal.no;
        return (
          <View style={styles.card} key={proposal.title}>
            <Text style={styles.eyebrowDark}>ACTIVE PROPOSAL</Text>
            <Text style={styles.cardTitle}>{proposal.title}</Text>
            <Text style={styles.muted}>{proposal.detail}</Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progress,
                  { width: `${(proposal.yes / total) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.voteCount}>
              {Math.round((proposal.yes / total) * 100)}% yes · {total} votes
            </Text>
            <View style={styles.voteRow}>
              <Pressable
                onPress={() => onVote(index, "yes")}
                style={[
                  styles.voteButton,
                  votes[index] === "yes" && styles.voteYes,
                ]}
              >
                <Text
                  style={[
                    styles.voteText,
                    votes[index] === "yes" && styles.voteTextActive,
                  ]}
                >
                  Vote yes
                </Text>
              </Pressable>
              <Pressable
                onPress={() => onVote(index, "no")}
                style={[
                  styles.voteButton,
                  votes[index] === "no" && styles.voteNo,
                ]}
              >
                <Text
                  style={[
                    styles.voteText,
                    votes[index] === "no" && styles.voteTextActive,
                  ]}
                >
                  Vote no
                </Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Stat({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={20} color="#164B7A" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}
function Split({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.split}>
      <Text style={[styles.splitValue, { color }]}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F9FD" },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    backgroundColor: "#0B2A50",
    margin: -20,
    marginBottom: 18,
    padding: 20,
    paddingTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    overflow: "hidden",
    minHeight: 98,
  },
  headerGlowOne: {
    position: "absolute",
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: "#1F5F9E",
    opacity: 0.52,
    right: -50,
    top: -66,
  },
  headerGlowTwo: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#FF6B00",
    opacity: 0.58,
    right: 44,
    bottom: -60,
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    flex: 1,
    marginRight: 12,
  },
  headerLogoFrame: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#FFF9ED",
    padding: 2,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  eyebrow: {
    color: "#E8F1FF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
  },
  eyebrowDark: {
    color: "#164B7A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  headerWordmark: {
    color: "#FFFDF7",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  headerSub: { color: "#DCE9FA", marginTop: 4, fontSize: 11 },
  headerLogo: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FF6B00",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  avatarText: { color: "#102746", fontWeight: "800" },
  modeBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 4,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: "#E9E4D8",
  },
  modeButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
    gap: 4,
  },
  modeButtonActive: { backgroundColor: "#164B7A" },
  modeButtonText: { color: "#46556B", fontSize: 11, fontWeight: "700" },
  modeButtonTextActive: { color: "#fff" },
  modeLabel: {
    color: "#164B7A",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: {
    color: "#102746",
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
    marginTop: 8,
  },
  description: {
    color: "#46556B",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 24,
  },
  search: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    paddingHorizontal: 14,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E9E4D8",
  },
  searchInput: { flex: 1, color: "#102746", marginLeft: 10, fontSize: 14 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E9E4D8",
  },
  serviceIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  category: {
    color: "#59708C",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  cardTitle: {
    color: "#102746",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 6,
    lineHeight: 23,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 20,
  },
  muted: { color: "#53657C", fontSize: 12, lineHeight: 18 },
  price: { color: "#C85A13", fontSize: 19, fontWeight: "800", marginTop: 3 },
  primaryButton: {
    backgroundColor: "#164B7A",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  splitCard: {
    backgroundColor: "#E2EEFF",
    borderRadius: 18,
    padding: 18,
    marginTop: 4,
  },
  splitTitle: {
    color: "#102746",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 5,
  },
  splitRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  split: { alignItems: "center" },
  splitValue: { fontSize: 20, fontWeight: "800" },
  success: {
    backgroundColor: "#E4F0FF",
    borderRadius: 14,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  successText: { color: "#164B7A", fontSize: 13, flex: 1 },
  statGrid: { flexDirection: "row", gap: 8, marginBottom: 14 },
  stat: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 13,
    flex: 1,
    minHeight: 105,
    borderWidth: 1,
    borderColor: "#E9E4D8",
  },
  statValue: {
    color: "#102746",
    fontSize: 19,
    fontWeight: "800",
    marginTop: 13,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  distance: {
    color: "#164B7A",
    backgroundColor: "#E4F0FF",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    fontWeight: "800",
  },
  jobFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E8EEF7",
    marginTop: 16,
    paddingTop: 14,
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#FCE0C7",
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 20,
  },
  progress: { height: 8, backgroundColor: "#1F6FB2", borderRadius: 8 },
  voteCount: { color: "#53657C", fontSize: 11, marginTop: 7 },
  voteRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  voteButton: {
    borderRadius: 11,
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: "#E2EEFF",
  },
  voteYes: { backgroundColor: "#164B7A" },
  voteNo: { backgroundColor: "#B83B4B" },
  voteText: { color: "#164B7A", fontWeight: "800", fontSize: 12 },
  voteTextActive: { color: "#fff" },
  onboardingSafe: {
    flex: 1,
    backgroundColor: "#0A2342",
    position: "relative",
    overflow: "hidden",
  },
  onboardingContent: { padding: 24, paddingTop: 24, paddingBottom: 48 },
  onboardingBrand: {
    alignItems: "center",
    justifyContent: "center",
    height: 252,
    marginBottom: 28,
    position: "relative",
  },
  brandOrbitLarge: {
    position: "absolute",
    width: 222,
    height: 222,
    borderRadius: 111,
    borderWidth: 1,
    borderColor: "rgba(255,107,0,0.72)",
    top: 9,
  },
  brandOrbitSmall: {
    position: "absolute",
    width: 188,
    height: 188,
    borderRadius: 94,
    backgroundColor: "#164B7A",
    opacity: 0.5,
    top: 26,
    transform: [{ rotate: "-16deg" }],
  },
  onboardingLogoFrame: {
    width: 168,
    height: 168,
    borderRadius: 84,
    overflow: "hidden",
    backgroundColor: "#FFF9ED",
    padding: 5,
    shadowColor: "#000",
    shadowOpacity: 0.42,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
    borderWidth: 3,
    borderColor: "#FF6B00",
  },
  onboardingLogo: {
    width: "100%",
    height: "100%",
    borderRadius: 77,
  },
  brandDeckShadow: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 34,
    alignSelf: "center",
    top: 43,
    backgroundColor: "#04152B",
    opacity: 0.7,
    transform: [{ perspective: 900 }, { rotateX: "58deg" }, { rotateZ: "45deg" }, { translateY: 20 }],
  },
  brandDeckBase: {
    position: "absolute",
    width: 162,
    height: 162,
    borderRadius: 32,
    alignSelf: "center",
    top: 36,
    backgroundColor: "#0B4B78",
    borderWidth: 1,
    borderColor: "#247BB2",
    transform: [{ perspective: 900 }, { rotateX: "58deg" }, { rotateZ: "45deg" }],
  },
  brandDeckTop: {
    position: "absolute",
    width: 146,
    height: 146,
    borderRadius: 28,
    alignSelf: "center",
    top: 43,
    backgroundColor: "#123A66",
    borderWidth: 1,
    borderColor: "rgba(255,107,0,0.65)",
    transform: [{ perspective: 900 }, { rotateX: "58deg" }, { rotateZ: "45deg" }],
  },
  brandCaption: {
    position: "absolute",
    bottom: -3,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandCaptionLine: {
    width: 22,
    height: 1,
    backgroundColor: "#FF6B00",
  },
  brandCaptionText: {
    color: "#EAF2FF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FF6B00",
    alignItems: "center",
    justifyContent: "center",
  },
  onboardingBrandText: {
    color: "#E8F1FF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
  onboardingKicker: {
    color: "#FF6B00",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  onboardingTitle: {
    color: "#FFFDF7",
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
    marginTop: 10,
  },
  onboardingDescription: {
    color: "#D9E7F8",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 24,
  },
  onboardingHint: {
    color: "#D9E7F8",
    fontSize: 12,
    marginTop: -2,
    marginBottom: 10,
  },
  stepTrack: { flexDirection: "row", gap: 6, marginBottom: 24 },
  stepDot: { height: 4, flex: 1, borderRadius: 4, backgroundColor: "#5279A4" },
  stepDotActive: { backgroundColor: "#FF6B00" },
  field: { marginBottom: 15 },
  fieldLabel: {
    color: "#F8F8FF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 7,
  },
  fieldInput: {
    backgroundColor: "#123A66",
    borderWidth: 1,
    borderColor: "#7DB7EE",
    borderRadius: 13,
    minHeight: 50,
    paddingHorizontal: 14,
    color: "#F8F8FF",
    fontSize: 14,
  },
  fieldInputShell: {
    borderRadius: 14,
    backgroundColor: "#071C36",
    paddingBottom: 4,
    shadowColor: "#020B18",
    shadowOpacity: 0.55,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  fieldInputMultiline: {
    minHeight: 82,
    paddingTop: 14,
    textAlignVertical: "top",
  },
  fieldInputDisabled: {
    opacity: 0.55,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingVertical: 7,
    marginTop: -6,
    marginBottom: 12,
  },
  locationButtonText: { color: "#FF6B00", fontSize: 12, fontWeight: "800" },
  regionSelect: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#7DB7EE",
    borderRadius: 13,
    backgroundColor: "#123A66",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  regionSelectText: { color: "#F8F8FF", fontSize: 14, flex: 1, paddingRight: 10 },
  regionPlaceholder: {
    color: "#D4E0F0",
    fontSize: 13,
    flex: 1,
    paddingRight: 10,
  },
  regionList: {
    maxHeight: 240,
    borderWidth: 1,
    borderColor: "#7DB7EE",
    borderRadius: 13,
    backgroundColor: "#123A66",
    overflow: "hidden",
    marginBottom: 15,
  },
  regionOption: {
    minHeight: 43,
    paddingHorizontal: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#467BAF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  regionOptionActive: { backgroundColor: "#164B7A" },
  regionOptionText: {
    color: "#E8F1FF",
    fontSize: 12,
    flex: 1,
    paddingRight: 8,
  },
  regionOptionTextActive: { color: "#F8F8FF", fontWeight: "800" },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  choiceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 16,
  },
  choice: {
    borderWidth: 1,
    borderColor: "#7DB7EE",
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#123A66",
  },
  choiceActive: { backgroundColor: "#FF6B00", borderColor: "#FF6B00" },
  choiceText: { color: "#E8F1FF", fontSize: 12, fontWeight: "700" },
  choiceTextActive: { color: "#102746" },
  roleList: { gap: 10 },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#123A66",
    borderWidth: 1,
    borderColor: "#7DB7EE",
    borderRadius: 16,
    padding: 13,
    gap: 12,
  },
  roleCardActive: { backgroundColor: "#164B7A", borderColor: "#A8CCF2" },
  roleIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#FFE1CC",
    alignItems: "center",
    justifyContent: "center",
  },
  roleIconActive: { backgroundColor: "#0A2E57" },
  roleCopy: { flex: 1 },
  roleTitle: { color: "#FFFDF7", fontSize: 15, fontWeight: "800" },
  roleTitleActive: { color: "#FFFDF7" },
  roleDetail: { color: "#D9E7F8", fontSize: 12, lineHeight: 17, marginTop: 3 },
  roleDetailActive: { color: "#E8F1FF" },
  formError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#3c292c",
    borderRadius: 12,
    padding: 12,
    marginTop: 18,
  },
  formErrorText: { color: "#ffd8dc", fontSize: 12, lineHeight: 17, flex: 1 },
  onboardingActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 28,
  },
  backButton: {
    borderWidth: 1,
    borderColor: "#A8CCF2",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  backButtonText: { color: "#EAF2FF", fontSize: 13, fontWeight: "800" },
  continueButton: {
    flex: 1,
    backgroundColor: "#FF6B00",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF6B00",
    shadowOpacity: 0.42,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8,
  },
  continueButtonText: { color: "#102746", fontSize: 13, fontWeight: "800" },
  companyActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#A8CCF2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButtonText: { color: "#164B7A", fontSize: 12, fontWeight: "800" },
});
