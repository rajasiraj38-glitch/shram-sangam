import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  Animated,
  Easing,
  Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useTranslation } from "react-i18next";
import "./i18n";

const logo = require("./assets/shram-sangam-logo.jpeg");
const logoTransparent = require("./assets/shram-sangam-logo-transparent.png");

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

function AshokaChakra({ size = 36 }: { size?: number }) {
  const spokes = Array.from({ length: 24 });
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: "#000080",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
      }}
    >
      {spokes.map((_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            width: 1.5,
            height: size - 4,
            backgroundColor: "#000080",
            opacity: 0.85,
            transform: [{ rotate: `${i * 15}deg` }],
          }}
        />
      ))}
      <View
        style={{
          width: size * 0.28,
          height: size * 0.28,
          borderRadius: size * 0.14,
          backgroundColor: "#000080",
        }}
      />
    </View>
  );
}

// NEW MAIN STARTING VIDEO ANIMATION COMPONENT
function AppSplash({ onFinish }: { onFinish: () => void }) {
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Pressable onPress={onFinish} style={StyleSheet.absoluteFillObject}>
      <Animated.View style={[styles.splashContainerCream, { opacity: splashOpacity }]}>
        <StatusBar style="light" backgroundColor="#000000" />
        <View style={styles.topNotchBlackBar} />

        <View style={styles.splashVideoCenterFrame}>
          <Animated.View
            style={{
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              source={logoTransparent}
              style={styles.splashVideoHeroLogo}
              resizeMode="contain"
            />

            <Text style={styles.splashVideoTitleText}>SHRAM SANGAM</Text>
            <Text style={styles.splashVideoTaglineText}>
              Connecting Skills with Opportunities
            </Text>

            <View style={styles.videoPlayingBadgeRow}>
              <View style={styles.videoPlayingPulseDot} />
              <Text style={styles.videoPlayingBadgeText}>
                Cooperative Platform Starting... (Tap to Skip)
              </Text>
            </View>
          </Animated.View>
        </View>

        <View style={styles.splashBottomSaffronBar} />
      </Animated.View>
    </Pressable>
  );
}

type Order = {
  id: string;
  category: string;
  title: string;
  description: string;
  city: string;
  locality: string;
  price: number;
  hasPhoto: boolean;
  status: "open" | "assigned" | "completed";
  assignedWorkerName?: string;
  rating?: number;
  comment?: string;
  createdAt: string;
};

type WorkerProfile = {
  id: string;
  name: string;
  trade: string;
  city: string;
  locality: string;
  distance: string;
  rating: number;
  reviewsCount: number;
  isOnline: boolean;
  phone: string;
  dailyRate: number;
};

type GroupProject = {
  id: string;
  projectName: string;
  category: string;
  teamSizeRequired: number;
  city: string;
  budget: number;
  durationDays: number;
  description: string;
  status: "planning" | "active" | "completed";
};

// INITIAL SIMULATED DATA
const initialWorkers: WorkerProfile[] = [
  {
    id: "w1",
    name: "Ramesh Kumar",
    trade: "Plumbing Specialist",
    city: "Bengaluru",
    locality: "HSR Layout",
    distance: "1.2 km away",
    rating: 4.9,
    reviewsCount: 42,
    isOnline: true,
    phone: "+91 9876543210",
    dailyRate: 750,
  },
  {
    id: "w2",
    name: "Suresh Sharma",
    trade: "Electrical & Appliances",
    city: "Bengaluru",
    locality: "Koramangala",
    distance: "2.8 km away",
    rating: 4.8,
    reviewsCount: 38,
    isOnline: false,
    phone: "+91 9876512345",
    dailyRate: 800,
  },
  {
    id: "w3",
    name: "Anita Devi",
    trade: "Home Cleaning & Care",
    city: "Bengaluru",
    locality: "Indiranagar",
    distance: "3.5 km away",
    rating: 5.0,
    reviewsCount: 56,
    isOnline: true,
    phone: "+91 9876587654",
    dailyRate: 650,
  },
  {
    id: "w4",
    name: "Vikram Singh",
    trade: "Master Carpenter",
    city: "Bengaluru",
    locality: "BTM Layout",
    distance: "4.1 km away",
    rating: 4.7,
    reviewsCount: 29,
    isOnline: false,
    phone: "+91 9876599999",
    dailyRate: 900,
  },
];

const initialOrders: Order[] = [
  {
    id: "ord-1",
    category: "Plumbing",
    title: "Kitchen Sink Pipe Leakage",
    description: "Main drainage pipe cracked under kitchen sink, causing water pooling on floor.",
    city: "Bengaluru",
    locality: "HSR Layout",
    price: 650,
    hasPhoto: true,
    status: "open",
    createdAt: "10 mins ago",
  },
  {
    id: "ord-2",
    category: "Electrical",
    title: "Main Breaker Switch Sparking",
    description: "Short circuit in hallway switchboard causing main MCB breaker trip.",
    city: "Bengaluru",
    locality: "Koramangala",
    price: 500,
    hasPhoto: true,
    status: "assigned",
    assignedWorkerName: "Suresh Sharma",
    createdAt: "1 hour ago",
  },
  {
    id: "ord-3",
    category: "Plumbing",
    title: "Bathroom Tap Replacement",
    description: "Corroded brass tap needs replacement with new quarter-turn faucet.",
    city: "Bengaluru",
    locality: "Indiranagar",
    price: 450,
    hasPhoto: false,
    status: "completed",
    assignedWorkerName: "Ramesh Kumar",
    rating: 5,
    comment: "Punctual, polite, and fixed the leakage very cleanly!",
    createdAt: "Yesterday",
  },
];

const initialGroupProjects: GroupProject[] = [
  {
    id: "proj-1",
    projectName: "Apartment Complex Plumbing Renovation",
    category: "Plumbing",
    teamSizeRequired: 5,
    city: "Bengaluru",
    budget: 45000,
    durationDays: 7,
    description: "Replacing central riser pipes and valve fittings across 24 flats.",
    status: "active",
  },
  {
    id: "proj-2",
    projectName: "Commercial Office Wiring & Panel Install",
    category: "Electrical",
    teamSizeRequired: 8,
    city: "Bengaluru",
    budget: 82000,
    durationDays: 10,
    description: "Complete electrical conduit wiring and sub-distribution panel installation.",
    status: "planning",
  },
];

// GPS LOCATION AUTO-DETECTOR
async function fetchCurrentDeviceLocation(): Promise<{
  fullAddress: string;
  city: string;
  locality: string;
  state: string;
  latitude: number;
  longitude: number;
}> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        const locality = place.name || place.street || place.district || place.subregion || "Current Area";
        const city = place.city || place.subregion || place.region || "My City";
        const state = place.region || "India";
        const fullAddress = `${locality}, ${city}, ${state}`;

        return {
          fullAddress,
          city,
          locality,
          state,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
      }
    }
  } catch (err) {
    console.log("GPS fetch error:", err);
  }

  return {
    fullAddress: "Current Live GPS Location",
    city: "Live Location",
    locality: "Current Area",
    state: "India",
    latitude: 12.9141,
    longitude: 77.6412,
  };
}

// LIVE CAMERA CAPTURE MODAL
function LiveCameraModal({
  title,
  subtitle,
  onCapture,
  onClose,
}: {
  title: string;
  subtitle?: string;
  onCapture: (photoFilename: string) => void;
  onClose: () => void;
}) {
  const [flashOn, setFlashOn] = useState(false);
  const [facingFront, setFacingFront] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const handleTriggerCapture = () => {
    setCapturing(true);
    setTimeout(() => {
      setCapturing(false);
      const filename = `photo_capture_${Date.now().toString().slice(-4)}.jpg`;
      setCapturedPhoto(filename);
    }, 1000);
  };

  const handleConfirmUsePhoto = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      onClose();
    }
  };

  return (
    <View style={styles.modalBackdrop}>
      <View style={styles.cameraModalCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Pressable onPress={onClose} style={styles.closeIconButton}>
            <Ionicons name="close" size={22} color="#1C1C1E" />
          </Pressable>
        </View>
        {subtitle ? <Text style={styles.modalSub}>{subtitle}</Text> : null}

        <View style={styles.viewfinderBox}>
          {capturedPhoto ? (
            <View style={styles.capturedPhotoPreviewBox}>
              <Ionicons name="image" size={48} color="#E65100" />
              <Text style={styles.capturedPhotoName}>{capturedPhoto}</Text>
              <Text style={styles.capturedPhotoMeta}>Full HD • 1080x1920 • 2.4 MB</Text>
              <View style={styles.livenessBadgePill}>
                <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                <Text style={styles.livenessBadgeText}>✓ Live Photo & Quality Verified</Text>
              </View>
            </View>
          ) : (
            <View style={styles.viewfinderFrame}>
              <Ionicons
                name={facingFront ? "person-outline" : "scan-outline"}
                size={64}
                color={capturing ? "#E65100" : "rgba(255, 255, 255, 0.8)"}
              />
              <Text style={styles.viewfinderGuideText}>
                {capturing
                  ? "Capturing Photo..."
                  : facingFront
                    ? "Center face for live verification check"
                    : "Align problem area or document inside frame"}
              </Text>
            </View>
          )}

          {!capturedPhoto && (
            <View style={styles.cameraControlsBar}>
              <Pressable onPress={() => setFlashOn(!flashOn)} style={styles.cameraControlPill}>
                <Ionicons name={flashOn ? "flash" : "flash-off-outline"} size={16} color="#FFFFFF" />
                <Text style={styles.cameraControlText}>{flashOn ? "Flash On" : "Flash Off"}</Text>
              </Pressable>

              <Pressable onPress={() => setFacingFront(!facingFront)} style={styles.cameraControlPill}>
                <Ionicons name="camera-reverse-outline" size={16} color="#FFFFFF" />
                <Text style={styles.cameraControlText}>{facingFront ? "Front" : "Rear"}</Text>
              </Pressable>
            </View>
          )}
        </View>

        {capturedPhoto ? (
          <View style={styles.modalActionsRow}>
            <Pressable onPress={() => setCapturedPhoto(null)} style={styles.modalCancelButton}>
              <Text style={styles.modalCancelText}>Retake Photo</Text>
            </Pressable>
            <Pressable onPress={handleConfirmUsePhoto} style={styles.continueButton}>
              <Text style={styles.continueButtonText}>Use Captured Photo</Text>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={handleTriggerCapture} style={styles.cameraShutterButton}>
            <Ionicons name="camera" size={22} color="#FFFFFF" />
            <Text style={styles.cameraShutterText}>
              {capturing ? "Capturing..." : "Capture Photo"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// IMAGE COMPRESSION ENGINE
async function compressImageForUpload(
  uri: string
): Promise<{ uri: string; size: string }> {
  try {
    const manip = require("expo-image-manipulator");
    if (manip && typeof manip.manipulateAsync === "function") {
      const result = await manip.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.6, format: manip.SaveFormat.JPEG }
      );
      return {
        uri: result.uri,
        size: "340 KB (Compressed 88%)",
      };
    }
  } catch (err) {
    console.log("Image compression error:", err);
  }
  return { uri, size: "2.1 MB" };
}

// NOTIFICATION DRAWER COMPONENT
function NotificationDrawer({
  notifications,
  onMarkRead,
  onClose,
}: {
  notifications: AppNotification[];
  onMarkRead: () => void;
  onClose: () => void;
}) {
  return (
    <View style={styles.modalBackdrop}>
      <View style={styles.notificationModalCard}>
        <View style={styles.rowBetween}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="notifications" size={20} color="#E65100" />
            <Text style={styles.modalTitle}>System Notifications</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeIconButton}>
            <Ionicons name="close" size={22} color="#1C1C1E" />
          </Pressable>
        </View>

        <ScrollView style={{ maxHeight: 400 }} keyboardShouldPersistTaps="handled">
          {notifications.length === 0 ? (
            <Text style={styles.emptyText}>No notifications yet.</Text>
          ) : (
            notifications.map((notif) => (
              <View
                key={notif.id}
                style={[
                  styles.notifItemCard,
                  !notif.read && styles.notifItemUnread,
                ]}
              >
                <View style={styles.notifIconCircle}>
                  <Ionicons
                    name={
                      notif.type === "request"
                        ? "flash-outline"
                        : notif.type === "offer"
                          ? "cash-outline"
                          : notif.type === "accepted"
                            ? "checkmark-circle-outline"
                            : "notifications-outline"
                    }
                    size={18}
                    color="#E65100"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifItemTitle}>{notif.title}</Text>
                  <Text style={styles.notifItemMessage}>{notif.message}</Text>
                  <Text style={styles.notifItemTime}>{notif.timestamp}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <Pressable
          onPress={() => {
            onMarkRead();
            onClose();
          }}
          style={styles.continueButton}
        >
          <Text style={styles.continueButtonText}>Mark All Read & Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

// TEAM PROJECT TYPES & DATA MODELS
export type TeamMember = {
  workerId: string;
  workerName: string;
  rating: number;
  completedJobs: number;
  experienceYears: number;
  isLeader: boolean;
  assignedTask?: string;
  contributionPercent: number;
};

export type TeamChatMessage = {
  id: string;
  senderName: string;
  senderRole: "customer" | "leader" | "member";
  text: string;
  timestamp: string;
};

export type TeamProject = {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  description: string;
  category: string;
  requiredWorkerCount: number; // 1, 2, 3, 5, 10
  location: string;
  city: string;
  preferredDate: string;
  preferredTime: string;
  mediaAttachments: MediaAttachment[];

  // Team Formation State
  joinedWorkers: TeamMember[];
  leaderId?: string;
  leaderName?: string;

  // Quotation & Status
  quotedPrice?: number; // Minimum ₹200
  estimatedDuration?: string;
  quotationNotes?: string;

  status:
    | "Request Submitted"
    | "Team Formation In Progress"
    | "Team Ready"
    | "Quotation Sent"
    | "Quotation Accepted"
    | "Assigned"
    | "Work Started"
    | "In Progress"
    | "Completed"
    | "Payment Completed";

  chatMessages: TeamChatMessage[];
  createdAt: string;
};

const initialTeamProjects: TeamProject[] = [
  {
    id: "team-proj-501",
    customerId: "cust-1",
    customerName: "Anita Sharma",
    title: "Apartment Building Central Plumbing & Riser Replacement",
    description: "Multi-floor riser pipe installation across 12 flats. Requires team of 5 plumbers for synchronized riser pipe fittings.",
    category: "Plumbing",
    requiredWorkerCount: 5,
    location: "Green Glen Apartments, Sector 2",
    city: "Bengaluru",
    preferredDate: "Tomorrow",
    preferredTime: "09:00 AM - 05:00 PM",
    mediaAttachments: [
      { id: "att-501", name: "apartment_riser_diagram.pdf", type: "document", size: "1.4 MB" }
    ],
    joinedWorkers: [
      {
        workerId: "w-1",
        workerName: "Ramesh Kumar",
        rating: 4.9,
        completedJobs: 142,
        experienceYears: 8,
        isLeader: true, // Auto-selected leader
        assignedTask: "Riser Pipe Alignment & Pressure Valve Testing",
        contributionPercent: 20,
      },
      {
        workerId: "w-2",
        workerName: "Suresh Plumber",
        rating: 4.8,
        completedJobs: 98,
        experienceYears: 5,
        isLeader: false,
        assignedTask: "Flats 1-6 Valve Connections",
        contributionPercent: 20,
      },
      {
        workerId: "w-3",
        workerName: "Vikram Mason",
        rating: 4.7,
        completedJobs: 75,
        experienceYears: 4,
        isLeader: false,
        assignedTask: "Wall Cutting & Plaster Seal",
        contributionPercent: 20,
      },
      {
        workerId: "w-4",
        workerName: "Anil Fitter",
        rating: 4.6,
        completedJobs: 60,
        experienceYears: 3,
        isLeader: false,
        assignedTask: "Flats 7-12 Pipe Joints",
        contributionPercent: 20,
      },
      {
        workerId: "w-5",
        workerName: "Dinesh Helper",
        rating: 4.5,
        completedJobs: 45,
        experienceYears: 2,
        isLeader: false,
        assignedTask: "Material Prep & Testing Support",
        contributionPercent: 20,
      },
    ],
    leaderId: "w-1",
    leaderName: "Ramesh Kumar (👑 Master Team Leader)",
    quotedPrice: 18500, // >= 200
    estimatedDuration: "3 Days",
    quotationNotes: "Includes team coordination, high-pressure PVC pipes, valves, and 6-month co-op warranty.",
    status: "Quotation Sent",
    chatMessages: [
      {
        id: "msg-1",
        senderName: "Ramesh Kumar (Leader)",
        senderRole: "leader",
        text: "Namaste Anita ji! Our 5-member team is assembled and ready. I have submitted the ₹18,500 project quotation.",
        timestamp: "10 mins ago"
      },
      {
        id: "msg-2",
        senderName: "Anita Sharma",
        senderRole: "customer",
        text: "Thank you Ramesh! Reviewing the quotation now.",
        timestamp: "5 mins ago"
      }
    ],
    createdAt: "1 hour ago"
  }
];

export type WorkerBidOffer = {
  id: string;
  requestId: string;
  workerId: string;
  workerName: string;
  workerRating: number;
  workerExperience: string;
  proposedPrice: number; // Minimum ₹200 validation rule
  estimatedTime: string;
  notes: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  createdAt: string;
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "request" | "offer" | "accepted" | "status" | "payment";
  read: boolean;
};

const initialBiddingRequests: BiddingRequest[] = [
  {
    id: "bid-req-101",
    customerId: "cust-1",
    customerName: "Anita Sharma",
    title: "Sub-distribution Electrical Panel Upgrade & Conduit Wiring",
    description: "Main circuit breaker keeps tripping. Need experienced electrician to inspect panel wiring and replace faulty 32A MCB.",
    category: "Electrical",
    preferredDate: "Tomorrow",
    preferredTime: "10:00 AM - 12:00 PM",
    location: "Flat 402, Green Glen Apartments, Sector 2",
    city: "Bengaluru",
    latitude: 12.9141,
    longitude: 77.6412,
    mediaAttachments: [
      { id: "att-101", name: "circuit_breaker_spark.jpg", type: "photo", size: "320 KB" }
    ],
    status: "Offer Sent",
    createdAt: "10 mins ago"
  }
];

const initialBidOffers: WorkerBidOffer[] = [
  {
    id: "offer-1",
    requestId: "bid-req-101",
    workerId: "w-1",
    workerName: "Ramesh Kumar",
    workerRating: 4.9,
    workerExperience: "8 Years Exp • 142 Jobs",
    proposedPrice: 450, // >= 200
    estimatedTime: "1.5 Hours",
    notes: "I carry standard Schneider MCB replacements and insulated tool kit.",
    status: "pending",
    createdAt: "5 mins ago"
  },
  {
    id: "offer-2",
    requestId: "bid-req-101",
    workerId: "w-2",
    workerName: "Suresh Electrician",
    workerRating: 4.8,
    workerExperience: "5 Years Exp • 98 Jobs",
    proposedPrice: 380, // >= 200
    estimatedTime: "2 Hours",
    notes: "Can inspect complete distribution board and check load balance.",
    status: "pending",
    createdAt: "2 mins ago"
  }
];

const initialNotifications: AppNotification[] = [
  {
    id: "notif-1",
    title: "⚡ New Bidding Request Available",
    message: "Anita Sharma posted 'Sub-distribution Panel Upgrade' near your location.",
    timestamp: "10 mins ago",
    type: "request",
    read: false
  },
  {
    id: "notif-2",
    title: "💬 New Proposal Received",
    message: "Ramesh Kumar proposed ₹450 for Electrical Panel Upgrade.",
    timestamp: "5 mins ago",
    type: "offer",
    read: false
  }
];

// MEDIA CHOICE PICKER MODAL (CAMERA VS GALLERY)
function MediaChoicePickerModal({
  title = "Attach Media File",
  mediaType = "photo",
  onSelectUri,
  onClose,
}: {
  title?: string;
  mediaType?: "photo" | "video";
  onSelectUri: (uri: string, filename: string) => void;
  onClose: () => void;
}) {
  const [showLiveCamera, setShowLiveCamera] = useState(false);

  const handleLaunchCamera = () => {
    setShowLiveCamera(true);
  };

  const handleLaunchGallery = () => {
    const timeId = Date.now().toString().slice(-4);
    const filename = `gallery_upload_${timeId}.${mediaType === "video" ? "mp4" : "jpg"} (340 KB Compressed)`;
    onSelectUri("", filename);
    onClose();
  };

  if (showLiveCamera) {
    return (
      <LiveCameraModal
        title={`Live Camera ${mediaType === "video" ? "Video" : "Photo"} Capture`}
        subtitle="Align problem area or document inside frame"
        onCapture={(photoFilename) => {
          onSelectUri("", `${photoFilename} (340 KB Compressed)`);
          onClose();
        }}
        onClose={() => setShowLiveCamera(false)}
      />
    );
  }

  return (
    <View style={styles.modalBackdrop}>
      <View style={styles.mediaChoiceModalCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Pressable onPress={onClose} style={styles.closeIconButton}>
            <Ionicons name="close" size={22} color="#1C1C1E" />
          </Pressable>
        </View>

        <Text style={styles.modalSub}>
          Choose how you would like to upload your {mediaType}:
        </Text>

        <View style={styles.mediaChoiceGridRow}>
          {/* Choice 1: Camera */}
          <Pressable
            onPress={handleLaunchCamera}
            style={styles.mediaChoiceBoxBtn}
          >
            <View style={styles.mediaChoiceIconCircle}>
              <Ionicons name="camera" size={28} color="#E65100" />
            </View>
            <Text style={styles.mediaChoiceTitleText}>Live Phone Camera</Text>
            <Text style={styles.mediaChoiceSubText}>Capture live photo/video with viewfinder</Text>
          </Pressable>

          {/* Choice 2: Gallery */}
          <Pressable
            onPress={handleLaunchGallery}
            style={styles.mediaChoiceBoxBtn}
          >
            <View style={[styles.mediaChoiceIconCircle, { backgroundColor: "rgba(37, 99, 235, 0.12)" }]}>
              <Ionicons name="images" size={28} color="#3B82F6" />
            </View>
            <Text style={styles.mediaChoiceTitleText}>Photo Gallery</Text>
            <Text style={styles.mediaChoiceSubText}>Choose photo/video from device storage</Text>
          </Pressable>
        </View>

        <Pressable onPress={onClose} style={styles.modalCancelButtonFull}>
          <Text style={styles.modalCancelText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

// UNIVERSAL MEDIA & FILE ATTACHMENT COMPONENT
type MediaAttachment = {
  id: string;
  name: string;
  type: "photo" | "video" | "document";
  size: string;
  duration?: string;
  uri?: string;
};

function UniversalMediaUploader({
  title = "Attach Photos, Videos & Document Files",
  attachments,
  onAddAttachment,
  onRemoveAttachment,
}: {
  title?: string;
  attachments: MediaAttachment[];
  onAddAttachment: (item: MediaAttachment) => void;
  onRemoveAttachment: (id: string) => void;
}) {
  const [choiceType, setChoiceType] = useState<"photo" | "video" | null>(null);

  const handleUriSelected = (uri: string, filename: string) => {
    const newItem: MediaAttachment = {
      id: `att-${Date.now().toString().slice(-4)}`,
      name: filename,
      type: choiceType || "photo",
      size: choiceType === "video" ? "12.4 MB" : "2.1 MB",
      duration: choiceType === "video" ? "30 sec" : undefined,
      uri,
    };
    onAddAttachment(newItem);
  };

  const handleDocumentPick = () => {
    const timeId = Date.now().toString().slice(-4);
    onAddAttachment({
      id: `att-${timeId}`,
      name: `site_blueprint_doc_${timeId}.pdf`,
      type: "document",
      size: "1.8 MB",
    });
  };

  return (
    <View style={styles.mediaUploaderContainer}>
      <Text style={styles.fieldLabel}>{title}</Text>

      <View style={styles.uploadActionRow}>
        <Pressable
          onPress={() => setChoiceType("photo")}
          style={styles.uploadActionBtnPill}
        >
          <Ionicons name="camera" size={16} color="#E65100" />
          <Text style={styles.uploadActionBtnText}>Photo (Camera/Gallery)</Text>
        </Pressable>

        <Pressable
          onPress={() => setChoiceType("video")}
          style={styles.uploadActionBtnPill}
        >
          <Ionicons name="videocam" size={16} color="#E65100" />
          <Text style={styles.uploadActionBtnText}>Video (Camera/Gallery)</Text>
        </Pressable>

        <Pressable
          onPress={handleDocumentPick}
          style={styles.uploadActionBtnPill}
        >
          <Ionicons name="document-attach" size={16} color="#E65100" />
          <Text style={styles.uploadActionBtnText}>Attach File</Text>
        </Pressable>
      </View>

      {attachments.length > 0 && (
        <View style={styles.attachedMediaList}>
          {attachments.map((item) => (
            <View key={item.id} style={styles.attachedMediaItem}>
              {item.uri && item.type === "photo" ? (
                <Image source={{ uri: item.uri }} style={styles.attachedThumbnailImage} />
              ) : (
                <View style={styles.attachedItemIconBox}>
                  <Ionicons
                    name={
                      item.type === "photo"
                        ? "image"
                        : item.type === "video"
                          ? "videocam"
                          : "document-text"
                    }
                    size={20}
                    color={
                      item.type === "photo"
                        ? "#38BDF8"
                        : item.type === "video"
                          ? "#E65100"
                          : "#16A34A"
                    }
                  />
                </View>
              )}

              <View style={{ flex: 1 }}>
                <Text style={styles.attachedFileName}>{item.name}</Text>
                <Text style={styles.attachedFileMeta}>
                  {item.type.toUpperCase()} • {item.size}{" "}
                  {item.duration ? `• ${item.duration}` : ""}
                </Text>
              </View>

              <Pressable
                onPress={() => onRemoveAttachment(item.id)}
                style={styles.removeMediaButton}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {choiceType && (
        <MediaChoicePickerModal
          title={`Upload ${choiceType === "video" ? "Video" : "Photo"}`}
          mediaType={choiceType}
          onSelectUri={handleUriSelected}
          onClose={() => setChoiceType(null)}
        />
      )}
    </View>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [userData, setUserData] = useState<OnboardingData>({
    username: "91113741645",
    password: "••••••••",
    confirmPassword: "••••••••",
    fullName: "Ramesh Kumar",
    phone: "91113741645",
    gender: "Male",
    address: "Current Live GPS Location",
    city: "Live Location",
    state: "India",
    role: "worker",
    category: "Plumbing",
    selectedServices: ["Plumbing"],
    organization: "Shram Sangam Cooperative",
  });
  const [role, setRole] = useState<Role>("worker");
  const [showSettings, setShowSettings] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);

  // Worker Verified Badges & Trust Score State
  const [workerBadges, setWorkerBadges] = useState<string[]>([
    "✓ Identity Verified",
    "✓ Electrician Verified",
    "✓ Plumber Verified",
  ]);
  const [workerTrustScore, setWorkerTrustScore] = useState<number>(85);

  // Shared simulated data
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [workers, setWorkers] = useState<WorkerProfile[]>(initialWorkers);
  const [groupProjects, setGroupProjects] = useState<GroupProject[]>(initialGroupProjects);
  const [workerOnline, setWorkerOnline] = useState(true);

  // Bidding, Team Projects & Notifications State
  const [biddingRequests, setBiddingRequests] = useState<BiddingRequest[]>(initialBiddingRequests);
  const [bidOffers, setBidOffers] = useState<WorkerBidOffer[]>(initialBidOffers);
  const [teamProjects, setTeamProjects] = useState<TeamProject[]>(initialTeamProjects);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);

  // Lifted Navigation Tab State for Hamburger Menu
  const [customerTab, setCustomerTab] = useState<"post" | "bids" | "teams" | "workers" | "myorders">("post");
  const [workerTab, setWorkerTab] = useState<"dispatch" | "bids">("dispatch");
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);

  // Load persisted session & fetch live device location on startup
  useEffect(() => {
    async function initLiveLocationAndState() {
      try {
        const savedUser = await AsyncStorage.getItem("shram_user_session");
        const savedOrders = await AsyncStorage.getItem("shram_orders_session");
        const savedRole = await AsyncStorage.getItem("shram_role_session");

        if (savedUser) {
          setUserData(JSON.parse(savedUser));
        }
        if (savedOrders) {
          setOrders(JSON.parse(savedOrders));
        }
        if (savedRole) {
          setRole(savedRole as Role);
        }

        // Auto-detect phone's actual live GPS location
        const liveLoc = await fetchCurrentDeviceLocation();
        if (liveLoc) {
          setUserData((prev) => ({
            ...prev,
            city: liveLoc.city,
            address: liveLoc.fullAddress,
            state: liveLoc.state,
          }));
        }
      } catch (err) {
        console.log("Startup init error:", err);
      }
    }

    initLiveLocationAndState();
  }, []);

  // Persist state updates to disk
  useEffect(() => {
    if (userData) {
      AsyncStorage.setItem("shram_user_session", JSON.stringify(userData)).catch(() => {});
    }
  }, [userData]);

  useEffect(() => {
    AsyncStorage.setItem("shram_orders_session", JSON.stringify(orders)).catch(() => {});
  }, [orders]);

  useEffect(() => {
    AsyncStorage.setItem("shram_role_session", role).catch(() => {});
  }, [role]);

  if (showSplash) {
    return <AppSplash onFinish={() => setShowSplash(false)} />;
  }

  if (!onboarded || !userData) {
    return (
      <OnboardingFlow
        onComplete={(data) => {
          setUserData(data);
          setRole(data.role);
          setOnboarded(true);
        }}
      />
    );
  }

  if (showVerification && userData) {
    return (
      <WorkerVerificationFlow
        userData={userData}
        onCompleteVerification={(badges, score) => {
          setWorkerBadges(badges);
          setWorkerTrustScore(score);
          setShowVerification(false);
          setOnboarded(true);
        }}
      />
    );
  }

  const activeCity = userData.city || "Bengaluru";

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" backgroundColor="#000000" />

      {/* Top Black Camera Notch Shield Bar */}
      <View style={styles.topNotchBlackBar} />

      {/* App Main Header with Role Badge and Settings Gear Button */}
      <View style={styles.appMainHeader}>
        <View style={styles.appHeaderLeft}>
          <Image
            source={logoTransparent}
            style={styles.headerLogoSmall}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.headerTitleText}>SHRAM SANGAM</Text>
            <View style={styles.roleBadgeRow}>
              <View
                style={[
                  styles.roleDot,
                  role === "customer"
                    ? styles.dotCustomer
                    : role === "worker"
                      ? styles.dotWorker
                      : styles.dotCompany,
                ]}
              />
              <Text style={styles.roleBadgeText}>
                {role === "customer"
                  ? "CUSTOMER MODE"
                  : role === "worker"
                    ? "WORKER MEMBER"
                    : "COMPANY PORTAL"}
              </Text>
              <Text style={styles.headerCityText}>• {activeCity}</Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable
            onPress={() => setShowNotificationDrawer(true)}
            style={styles.settingsHeaderButton}
          >
            <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
            {notifications.some((n) => !n.read) && (
              <View style={styles.notifHeaderBadgeDot} />
            )}
          </Pressable>

          <Pressable
            onPress={() => setShowHamburgerMenu(true)}
            style={styles.settingsHeaderButton}
          >
            <Ionicons name="menu-outline" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.mainScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Isolated Customer Section */}
        {role === "customer" && (
          <CustomerSection
            userData={userData}
            orders={orders}
            setOrders={setOrders}
            workers={workers}
            biddingRequests={biddingRequests}
            setBiddingRequests={setBiddingRequests}
            bidOffers={bidOffers}
            setBidOffers={setBidOffers}
            notifications={notifications}
            setNotifications={setNotifications}
            teamProjects={teamProjects}
            setTeamProjects={setTeamProjects}
            activeTab={customerTab}
            setActiveTab={setCustomerTab}
          />
        )}

        {/* Isolated Worker Section */}
        {role === "worker" && (
          <WorkerSection
            userData={userData}
            orders={orders}
            setOrders={setOrders}
            isOnline={workerOnline}
            setIsOnline={setWorkerOnline}
            workerBadges={workerBadges}
            trustScore={workerTrustScore}
            onOpenVerification={() => setShowVerification(true)}
            biddingRequests={biddingRequests}
            setBiddingRequests={setBiddingRequests}
            bidOffers={bidOffers}
            setBidOffers={setBidOffers}
            notifications={notifications}
            setNotifications={setNotifications}
            teamProjects={teamProjects}
            setTeamProjects={setTeamProjects}
          />
        )}

        {/* Isolated Company Section */}
        {role === "company" && (
          <CompanySection
            userData={userData}
            workers={workers}
            projects={groupProjects}
            setProjects={setGroupProjects}
          />
        )}
      </ScrollView>

      {/* Floating Bhashini / Gemini AI Voice Assistant Trigger Button */}
      <Pressable onPress={() => setShowAiAssistant(true)} style={styles.floatingAiFab}>
        <Ionicons name="sparkles" size={22} color="#0F172A" />
      </Pressable>

      {/* AI Assistant Modal */}
      {showAiAssistant && (
        <AIAssistantModal
          activeRole={role}
          onClose={() => setShowAiAssistant(false)}
        />
      )}

      {/* Settings Screen Modal */}
      {showSettings && (
        <SettingsModal
          userData={userData}
          setUserData={setUserData}
          activeRole={role}
          workerBadges={workerBadges}
          trustScore={workerTrustScore}
          onOpenVerification={() => setShowVerification(true)}
          onSwitchRole={(newRole) => {
            setRole(newRole);
            setUserData((prev) => (prev ? { ...prev, role: newRole } : prev));
          }}
          onClose={() => setShowSettings(false)}
          onSignOut={() => {
            setShowSettings(false);
            setOnboarded(false);
          }}
        />
      )}

      {/* Notifications Drawer Modal */}
      {showNotificationDrawer && (
        <NotificationDrawer
          notifications={notifications}
          onMarkRead={() =>
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
          }
          onClose={() => setShowNotificationDrawer(false)}
        />
      )}

      {/* Hamburger Menu Modal */}
      {showHamburgerMenu && (
        <HamburgerMenuModal
          role={role}
          customerTab={customerTab}
          setCustomerTab={setCustomerTab}
          workerTab={workerTab}
          setWorkerTab={setWorkerTab}
          onClose={() => setShowHamburgerMenu(false)}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}
    </SafeAreaView>
  );
}

// WORKER VERIFICATION FLOW COMPONENT
function WorkerVerificationFlow({
  userData,
  onCompleteVerification,
}: {
  userData: OnboardingData;
  onCompleteVerification: (badges: string[], trustScore: number) => void;
}) {
  const [step, setStep] = useState<2 | 3 | 4>(2);

  const [idType, setIdType] = useState<"aadhaar" | "license" | "voter">("aadhaar");
  const [frontUploaded, setFrontUploaded] = useState(false);
  const [backUploaded, setBackUploaded] = useState(false);
  const [idVerified, setIdVerified] = useState(false);
  const [fetchingDigiLocker, setFetchingDigiLocker] = useState(false);

  const availableSkills = [
    "Electrician",
    "Plumber",
    "Carpenter",
    "Painter",
    "AC Technician",
    "House Cleaner",
    "Mason",
    "Welder",
    "Tailor",
    "Driver",
    "Mechanic",
    "Other",
  ];
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    "Electrician",
    "Plumber",
    "Carpenter",
  ]);

  const [videosMap, setVideosMap] = useState<
    Record<string, { recorded: boolean; aiScore: number; status: string }>
  >({
    Electrician: { recorded: true, aiScore: 92, status: "Likely Verified" },
    Plumber: { recorded: true, aiScore: 88, status: "Under Review" },
    Carpenter: { recorded: true, aiScore: 90, status: "Likely Verified" },
  });

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) => {
      const exists = prev.includes(skill);
      const next = exists ? prev.filter((s) => s !== skill) : [...prev, skill];
      if (!exists && !videosMap[skill]) {
        setVideosMap((vm) => ({
          ...vm,
          [skill]: { recorded: false, aiScore: 85, status: "Pending Upload" },
        }));
      }
      return next;
    });
  };

  const handleRecordVideo = (skill: string) => {
    setVideosMap((vm) => ({
      ...vm,
      [skill]: {
        recorded: true,
        aiScore: Math.floor(Math.random() * 8) + 88,
        status: "Likely Verified",
      },
    }));
  };

  const trustScore = 85;

  const handleDigiLockerFetch = () => {
    setFetchingDigiLocker(true);
    setTimeout(() => {
      setFetchingDigiLocker(false);
      setFrontUploaded(true);
      setBackUploaded(true);
      setIdVerified(true);
      setStep(3);
    }, 2000);
  };

  const handleFinishStep2 = () => {
    setIdVerified(true);
    setStep(3);
  };

  const handleFinishStep3 = () => {
    setStep(4);
  };

  const earnedBadges = [
    "✓ Identity Verified",
    ...selectedSkills.map((s) => `✓ ${s} Verified`),
  ];

  return (
    <SafeAreaView style={styles.onboardingSafe}>
      <StatusBar style="light" backgroundColor="#000000" />
      <View style={styles.topNotchBlackBar} />
      <StatusBar style="light" />
      <View style={styles.bgOrb1} />
      <View style={styles.bgOrb2} />

      <ScrollView contentContainerStyle={styles.onboardingContent} keyboardShouldPersistTaps="handled">
        <View style={styles.verifyProgressHeader}>
          <View style={styles.progressStepBox}>
            <Ionicons name="checkmark-circle" size={16} color="#34D399" />
            <Text style={styles.progressStepDone}>Account</Text>
          </View>

          <Text style={styles.progressArrow}>→</Text>

          <View style={styles.progressStepBox}>
            <Ionicons
              name={step >= 2 ? (idVerified ? "checkmark-circle" : "ellipse") : "ellipse-outline"}
              size={16}
              color={step >= 2 ? "#FF6B00" : "#64748B"}
            />
            <Text style={step === 2 ? styles.progressStepActive : step > 2 ? styles.progressStepDone : styles.progressStepMuted}>
              Identity
            </Text>
          </View>

          <Text style={styles.progressArrow}>→</Text>

          <View style={styles.progressStepBox}>
            <Ionicons
              name={step >= 3 ? "ellipse" : "ellipse-outline"}
              size={16}
              color={step >= 3 ? "#FF6B00" : "#64748B"}
            />
            <Text style={step === 3 ? styles.progressStepActive : step === 4 ? styles.progressStepDone : styles.progressStepMuted}>
              Skills
            </Text>
          </View>
        </View>

        {step === 2 && (
          <View style={styles.screenContainerBox}>
            <Text style={styles.heroHeading}>Verify Your Identity</Text>
            <Text style={styles.heroSubheading}>
              Complete identity verification to build trust with customers.
            </Text>

            <Text style={styles.fieldLabel}>Select Government ID Type</Text>
            <View style={styles.idChoiceGrid}>
              {[
                { type: "aadhaar", label: "Aadhaar Card", icon: "card-outline" },
                { type: "license", label: "Driving License", icon: "car-outline" },
                { type: "voter", label: "Voter ID", icon: "id-card-outline" },
              ].map((item) => (
                <Pressable
                  key={item.type}
                  onPress={() => setIdType(item.type as any)}
                  style={[styles.idChoiceCard, idType === item.type && styles.idChoiceCardActive]}
                >
                  <Ionicons name={item.icon as any} size={22} color={idType === item.type ? "#FF6B00" : "#94A3B8"} />
                  <Text style={[styles.idChoiceText, idType === item.type && styles.idChoiceTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.uploadSectionBox}>
              <Text style={styles.fieldLabel}>Upload Document Images</Text>

              <Pressable
                onPress={() => setFrontUploaded(!frontUploaded)}
                style={[styles.uploadBoxItem, frontUploaded && styles.uploadBoxItemActive]}
              >
                <Ionicons name={frontUploaded ? "checkmark-circle" : "cloud-upload-outline"} size={22} color={frontUploaded ? "#34D399" : "#FF6B00"} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.uploadTitleText}>
                    {frontUploaded ? "✓ Front Side Uploaded" : "Upload Front Side"}
                  </Text>
                  <Text style={styles.uploadSubText}>
                    {frontUploaded ? "id_front_scan.png" : "Clear photo of front side"}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => setBackUploaded(!backUploaded)}
                style={[styles.uploadBoxItem, backUploaded && styles.uploadBoxItemActive]}
              >
                <Ionicons name={backUploaded ? "checkmark-circle" : "camera-outline"} size={22} color={backUploaded ? "#34D399" : "#FF6B00"} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.uploadTitleText}>
                    {backUploaded ? "✓ Back Side Uploaded" : "Upload Back Side / Capture Camera"}
                  </Text>
                  <Text style={styles.uploadSubText}>
                    {backUploaded ? "id_back_scan.png" : "Take a live photo or upload back side"}
                  </Text>
                </View>
              </Pressable>
            </View>

            <View style={styles.infoBannerBox}>
              <Ionicons name="information-circle-outline" size={18} color="#38BDF8" />
              <Text style={styles.infoBannerText}>Ensure your document is clear and readable with no glare.</Text>
            </View>

            <Pressable onPress={handleFinishStep2} style={[styles.continueButton, { backgroundColor: "#FAFAFA", borderColor: "#EBE5DF" }]}>
              <Text style={[styles.continueButtonText, { color: "#1C1C1E" }]}>Manual Verification</Text>
            </Pressable>

            <Pressable onPress={handleDigiLockerFetch} style={styles.btnPrimarySaffron}>
              <Ionicons name={fetchingDigiLocker ? "sync" : "shield-checkmark"} size={18} color="#FFFFFF" />
              <Text style={styles.btnPrimarySaffronText}>
                {fetchingDigiLocker ? "Fetching from Govt. Servers..." : "1-CLICK DIGILOCKER e-KYC FETCH"}
              </Text>
            </Pressable>

            <View style={styles.securityNoticeRow}>
              <Ionicons name="lock-closed" size={14} color="#94A3B8" />
              <Text style={styles.securityNoticeText}>
                Your identity information is encrypted and used only for verification purposes.
              </Text>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.screenContainerBox}>
            <Text style={styles.heroHeading}>Verify Your Skills</Text>
            <Text style={styles.heroSubheading}>
              Select your skills and upload 30-60 second work demonstration videos.
            </Text>

            <Text style={styles.fieldLabel}>Select Skills (Multiple Selection Allowed)</Text>
            <View style={styles.skillsChipGrid}>
              {availableSkills.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <Pressable
                    key={skill}
                    onPress={() => toggleSkill(skill)}
                    style={[styles.skillChipItem, isSelected && styles.skillChipItemActive]}
                  >
                    <Ionicons
                      name={isSelected ? "checkmark-circle" : "add-circle-outline"}
                      size={16}
                      color={isSelected ? "#0F172A" : "#94A3B8"}
                    />
                    <Text style={[styles.skillChipText, isSelected && styles.skillChipTextActive]}>
                      {skill}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Skill Video Demonstration Cards</Text>

            {selectedSkills.map((skill) => {
              const video = videosMap[skill] || { recorded: false, aiScore: 85, status: "Pending Upload" };
              return (
                <View key={skill} style={styles.skillVideoCard}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.videoCardSkillTitle}>{skill} Verification</Text>
                    <View style={[styles.statusBadgePill, video.recorded ? styles.badgeOnline : styles.badgeOffline]}>
                      <Text style={[styles.statusBadgeText, video.recorded ? styles.textGreen : styles.textGrey]}>
                        {video.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.videoReqText}>
                    📹 Requirements: 30-60 sec video showing actual work demonstration, good lighting, and clear visibility of tools.
                  </Text>

                  {video.recorded ? (
                    <View style={styles.videoThumbnailPreview}>
                      <Ionicons name="videocam" size={24} color="#FF6B00" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.videoFilenameText}>{skill}_work_demo.mp4 (42 sec)</Text>
                        <Text style={styles.videoStatusText}>✓ Video Uploaded & Analyzed by AI</Text>
                      </View>
                      <Ionicons name="checkmark-circle" size={20} color="#34D399" />
                    </View>
                  ) : (
                    <View style={styles.videoCardActions}>
                      <Pressable
                        onPress={() => handleRecordVideo(skill)}
                        style={styles.recordVideoButton}
                      >
                        <Ionicons name="videocam" size={16} color="#0F172A" />
                        <Text style={styles.recordVideoText}>Record Video</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleRecordVideo(skill)}
                        style={styles.uploadVideoButton}
                      >
                        <Ionicons name="cloud-upload-outline" size={16} color="#FF6B00" />
                        <Text style={styles.uploadVideoText}>Upload Video</Text>
                      </Pressable>
                    </View>
                  )}

                  {video.recorded && (
                    <View style={styles.aiScoreBox}>
                      <View style={styles.rowBetween}>
                        <Text style={styles.aiScoreLabel}>AI Skill Confidence Score</Text>
                        <Text style={styles.aiScoreValue}>{video.aiScore}%</Text>
                      </View>
                      <View style={styles.aiScoreTrack}>
                        <View style={[styles.aiScoreBar, { width: `${video.aiScore}%` }]} />
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            <View style={styles.trustScoreCard}>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.trustScoreTitle}>Worker Trust Score</Text>
                  <Text style={styles.trustScoreSub}>Computed from ID verification, skill videos & training</Text>
                </View>

                <View style={styles.trustScoreCircle}>
                  <Text style={styles.trustScoreNumber}>{trustScore}</Text>
                  <Text style={styles.trustScoreMax}>/100</Text>
                </View>
              </View>
            </View>

            <View style={styles.dualButtonRow}>
              <Pressable onPress={handleFinishStep3} style={styles.btnPrimarySaffronFlex}>
                <Text style={styles.btnPrimarySaffronText}>Complete Verification</Text>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              </Pressable>

              <Pressable onPress={handleFinishStep3} style={styles.btnWhatsAppFallback}>
                <Text style={styles.btnWhatsAppText}>Skip Video & Activate Now (+85 Trust Score)</Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.screenContainerBox}>
            <View style={styles.celebrationCircle}>
              <Ionicons name="shield-checkmark" size={48} color="#FF6B00" />
            </View>

            <Text style={styles.heroHeading}>Verification Complete!</Text>
            <Text style={styles.heroSubheading}>
              Your profile is now verified and ready to receive work opportunities across {userData.city || "Bengaluru"}.
            </Text>

            <View style={styles.badgesSummaryBox}>
              <View style={styles.badgeSummaryItem}>
                <Ionicons name="checkmark-circle" size={20} color="#34D399" />
                <Text style={styles.badgeSummaryText}>Government ID Verified</Text>
              </View>

              {selectedSkills.map((s) => (
                <View key={s} style={styles.badgeSummaryItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#34D399" />
                  <Text style={styles.badgeSummaryText}>{s} Skill Verified</Text>
                </View>
              ))}

              <View style={styles.verifiedBadgeHeaderPill}>
                <Ionicons name="ribbon" size={18} color="#FF6B00" />
                <Text style={styles.verifiedBadgeHeaderText}>🏆 Verified Worker Badge Active</Text>
              </View>

              <View style={styles.badgeSummaryItem}>
                <Ionicons name="star" size={20} color="#FF9933" />
                <Text style={styles.badgeSummaryText}>Trust Score: {trustScore} / 100</Text>
              </View>
            </View>

            <Pressable
              onPress={() => onCompleteVerification(earnedBadges, trustScore)}
              style={styles.continueButton}
            >
              <Text style={styles.continueButtonText}>Go To Worker Dashboard</Text>
              <Ionicons name="arrow-forward" size={18} color="#0F172A" />
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// HAMBURGER MENU MODAL
function HamburgerMenuModal({
  role,
  customerTab,
  setCustomerTab,
  workerTab,
  setWorkerTab,
  onClose,
  onOpenSettings,
}: {
  role: Role;
  customerTab: string;
  setCustomerTab: (tab: any) => void;
  workerTab: string;
  setWorkerTab: (tab: any) => void;
  onClose: () => void;
  onOpenSettings: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -300,
      duration: 200,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const MenuOption = ({ icon, label, active, onPress }: any) => (
    <Pressable style={[styles.menuOptionBtn, active && styles.menuOptionBtnActive]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={active ? "#0284C7" : "#4B5563"} />
      <Text style={[styles.menuOptionText, active && styles.menuOptionTextActive]}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)" }]} onPress={closeMenu} />
      <Animated.View
        style={[
          styles.hamburgerDrawer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <View style={styles.hamburgerHeader}>
          <Text style={styles.hamburgerTitle}>Menu</Text>
          <Pressable onPress={closeMenu} style={styles.closeIconButton}>
            <Ionicons name="close" size={24} color="#1C1C1E" />
          </Pressable>
        </View>

        <ScrollView style={styles.hamburgerScroll}>
          {role === "customer" && (
            <>
              <MenuOption icon="create-outline" label="Post Order" active={customerTab === "post"} onPress={() => { setCustomerTab("post"); closeMenu(); }} />
              <MenuOption icon="flash-outline" label="Bids" active={customerTab === "bids"} onPress={() => { setCustomerTab("bids"); closeMenu(); }} />
              <MenuOption icon="people" label="Teams" active={customerTab === "teams"} onPress={() => { setCustomerTab("teams"); closeMenu(); }} />
              <MenuOption icon="people-outline" label="Workers" active={customerTab === "workers"} onPress={() => { setCustomerTab("workers"); closeMenu(); }} />
              <MenuOption icon="receipt-outline" label="Orders" active={customerTab === "myorders"} onPress={() => { setCustomerTab("myorders"); closeMenu(); }} />
            </>
          )}

          {role === "worker" && (
            <>
              <MenuOption icon="flash-outline" label="Instant Feed" active={workerTab === "dispatch"} onPress={() => { setWorkerTab("dispatch"); closeMenu(); }} />
              <MenuOption icon="pricetags-outline" label="Bidding Opportunities" active={workerTab === "bids"} onPress={() => { setWorkerTab("bids"); closeMenu(); }} />
            </>
          )}

          <View style={styles.hamburgerDivider} />

          <MenuOption icon="settings-outline" label="Settings & Profile" onPress={() => { closeMenu(); onOpenSettings(); }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// CUSTOMER SECTION COMPONENT
function CustomerSection({
  userData,
  orders,
  setOrders,
  workers,
  biddingRequests,
  setBiddingRequests,
  bidOffers,
  setBidOffers,
  notifications,
  setNotifications,
  teamProjects,
  setTeamProjects,
  activeTab,
  setActiveTab,
}: {
  userData: OnboardingData;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  workers: WorkerProfile[];
  biddingRequests: BiddingRequest[];
  setBiddingRequests: React.Dispatch<React.SetStateAction<BiddingRequest[]>>;
  bidOffers: WorkerBidOffer[];
  setBidOffers: React.Dispatch<React.SetStateAction<WorkerBidOffer[]>>;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  teamProjects: TeamProject[];
  setTeamProjects: React.Dispatch<React.SetStateAction<TeamProject[]>>;
  activeTab: "post" | "bids" | "teams" | "workers" | "myorders";
  setActiveTab: React.Dispatch<React.SetStateAction<"post" | "bids" | "teams" | "workers" | "myorders">>;
}) {
  const [category, setCategory] = useState("Plumbing");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("650");
  const [requiredWorkerCount, setRequiredWorkerCount] = useState<number>(1);
  const [serviceAddress, setServiceAddress] = useState(
    userData.address || "Current Live GPS Location",
  );
  const [detectingGps, setDetectingGps] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Bidding Form State
  const [biddingTitle, setBiddingTitle] = useState("");
  const [biddingCategory, setBiddingCategory] = useState("Electrical");
  const [biddingDesc, setBiddingDesc] = useState("");
  const [biddingDate, setBiddingDate] = useState("Tomorrow");
  const [biddingTime, setBiddingTime] = useState("10:00 AM - 12:00 PM");
  const [biddingLocation, setBiddingLocation] = useState(
    userData.address || "Current Live GPS Location",
  );
  const [biddingMedia, setBiddingMedia] = useState<MediaAttachment[]>([]);
  const [biddingSuccessMsg, setBiddingSuccessMsg] = useState("");

  const [mediaAttachments, setMediaAttachments] = useState<MediaAttachment[]>([
    {
      id: "att-1",
      name: "kitchen_pipe_leak.jpg",
      type: "photo",
      size: "2.4 MB",
    },
  ]);

  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [selectedStars, setSelectedStars] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");

  const userCity = userData.city || "Live Location";

  const handleAutoDetectGPS = async () => {
    setDetectingGps(true);
    const loc = await fetchCurrentDeviceLocation();
    if (loc) {
      setServiceAddress(loc.fullAddress);
      setBiddingLocation(loc.fullAddress);
    }
    setDetectingGps(false);
  };

  const handlePostOrder = async () => {
    if (!title || !description) return;

    // Supabase Cloud Sync Integration
    let insertedOrder = null;
    try {
      const { supabase } = require("./supabaseClient");
      if (supabase) {
        console.log("Syncing to Supabase Cloud...");
        const { data, error } = await supabase.from('orders').insert([{
          category,
          title,
          description,
          city: userCity,
          locality: serviceAddress || "Live Location Area",
          price: parseInt(price) || 500,
          status: "open",
        }]).select();

        if (data && data.length > 0) {
           insertedOrder = data[0];
        }
      }
    } catch (e) {
      console.log("Supabase error (using local fallback)", e);
    }

    if (requiredWorkerCount > 1) {
      // TEAM FORMATION MODE ACTIVATED
      const newTeamProj: TeamProject = {
        id: `team-proj-${Date.now().toString().slice(-4)}`,
        customerId: "cust-1",
        customerName: userData.fullName || "Anita Sharma",
        title,
        description,
        category,
        requiredWorkerCount,
        location: serviceAddress || "Live Location Area",
        city: userCity,
        preferredDate: "Tomorrow",
        preferredTime: "10:00 AM - 04:00 PM",
        mediaAttachments,
        joinedWorkers: [],
        status: "Team Formation In Progress",
        chatMessages: [],
        createdAt: "Just now",
      };

      setTeamProjects((prev) => [newTeamProj, ...prev]);

      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          title: "⚡ New Team Project Available Near You",
          message: `'${title}' requires a team of ${requiredWorkerCount} ${category} workers. Tap to join team!`,
          timestamp: "Just now",
          type: "request",
          read: false,
        },
        ...prev,
      ]);

      setTitle("");
      setDescription("");
      setSuccessMsg(`Team Project "${title}" posted for ${requiredWorkerCount} workers! Team formation in progress.`);
      setTimeout(() => setSuccessMsg(""), 4000);
      return;
    }

    // SINGLE WORKER ORDER (EXACT EXISTING WORKFLOW UNCHANGED)
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      category,
      title,
      description,
      city: userCity,
      locality: serviceAddress || "Live Location Area",
      price: parseInt(price) || 500,
      hasPhoto: mediaAttachments.length > 0,
      status: "open",
      createdAt: "Just now",
    };
    setOrders((prev) => [newOrder, ...prev]);
    setTitle("");
    setDescription("");
    setSuccessMsg(`Order "${title}" posted! Nearby workers have been notified.`);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleAcceptTeamQuotation = (projId: string) => {
    setTeamProjects((prev) =>
      prev.map((tp) =>
        tp.id === projId ? { ...tp, status: "Quotation Accepted" } : tp,
      ),
    );

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: "🎉 Quotation Accepted!",
        message: "Customer accepted team project quotation. Team project assigned.",
        timestamp: "Just now",
        type: "accepted",
        read: false,
      },
      ...prev,
    ]);
  };

  const handlePostBiddingRequest = () => {
    if (!biddingTitle || !biddingDesc) return;
    const newReqId = `bid-req-${Date.now().toString().slice(-4)}`;
    const newReq: BiddingRequest = {
      id: newReqId,
      customerId: "cust-1",
      customerName: userData.fullName || "Anita Sharma",
      title: biddingTitle,
      description: biddingDesc,
      category: biddingCategory,
      preferredDate: biddingDate,
      preferredTime: biddingTime,
      location: biddingLocation,
      city: userCity,
      latitude: 12.9141,
      longitude: 77.6412,
      mediaAttachments: biddingMedia,
      status: "Request Posted",
      createdAt: "Just now",
    };

    setBiddingRequests((prev) => [newReq, ...prev]);

    // Send system notification
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: "⚡ New Bidding Request Available",
        message: `${userData.fullName || "Customer"} posted '${biddingTitle}' in ${biddingCategory}.`,
        timestamp: "Just now",
        type: "request",
        read: false,
      },
      ...prev,
    ]);

    setBiddingTitle("");
    setBiddingDesc("");
    setBiddingMedia([]);
    setBiddingSuccessMsg(`Bidding request "${biddingTitle}" posted! Matching nearby workers notified.`);
    setTimeout(() => setBiddingSuccessMsg(""), 4000);
  };

  const handleAcceptWorkerBid = (offer: WorkerBidOffer) => {
    setBidOffers((prev) =>
      prev.map((o) =>
        o.id === offer.id
          ? { ...o, status: "accepted" }
          : o.requestId === offer.requestId
            ? { ...o, status: "expired" }
            : o,
      ),
    );

    setBiddingRequests((prev) =>
      prev.map((r) =>
        r.id === offer.requestId
          ? {
              ...r,
              selectedWorkerId: offer.workerId,
              status: "Offer Accepted",
            }
          : r,
      ),
    );

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: "🎉 Proposal Accepted!",
        message: `Your ₹${offer.proposedPrice} bid was accepted by customer. You are assigned to the job.`,
        timestamp: "Just now",
        type: "accepted",
        read: false,
      },
      ...prev,
    ]);
  };

  const handleRejectWorkerBid = (offerId: string) => {
    setBidOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, status: "rejected" } : o)),
    );
  };

  const handleSubmitRating = () => {
    if (!ratingOrder) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === ratingOrder.id
          ? { ...o, rating: selectedStars, comment: feedbackComment }
          : o,
      ),
    );
    setRatingOrder(null);
    setFeedbackComment("");
  };

  const cityWorkers = workers.filter(
    (w) => w.city.toLowerCase() === userCity.toLowerCase() || true,
  );

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.heroTitleText}>Trusted Local Services</Text>
      <Text style={styles.heroSubText}>
        Post plumbing or repair orders with problem photos. Nearby workers in {userCity} will be notified.
      </Text>

      {/* TABS TRANSFERRED TO HAMBURGER MENU */}

      {activeTab === "post" && (
        <View style={styles.contentCard}>
          <Text style={styles.cardHeaderTitle}>Request a Service</Text>

          {successMsg ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#34D399" />
              <Text style={styles.successBannerText}>{successMsg}</Text>
            </View>
          ) : null}

          <Text style={styles.fieldLabel}>Service Category</Text>
          <View style={styles.choiceGrid}>
            {["Plumbing", "Electrical", "Cleaning", "Caregiving", "Carpentry", "Painting"].map((cat) => (
              <Choice
                key={cat}
                label={cat}
                active={category === cat}
                onPress={() => setCategory(cat)}
              />
            ))}
          </View>

          {/* STEP 1: Required Workers Count Field (>1 Triggers Dynamic Team Formation) */}
          <Text style={styles.fieldLabel}>Required Workers Count (1 = Single Job, >1 = Dynamic Team Project)</Text>
          <View style={styles.choiceGrid}>
            {[1, 2, 3, 5, 10].map((cnt) => (
              <Choice
                key={cnt}
                label={cnt === 1 ? "1 Worker (Single)" : `${cnt} Workers (Team)`}
                active={requiredWorkerCount === cnt}
                onPress={() => setRequiredWorkerCount(cnt)}
              />
            ))}
          </View>

          {/* GPS Auto-Detect Button */}
          <Pressable onPress={handleAutoDetectGPS} style={styles.locationButton}>
            <Ionicons name="navigate" size={16} color="#E65100" />
            <Text style={styles.locationButtonText}>
              {detectingGps ? "Locating via Phone GPS..." : "📍 Auto-Detect Current GPS Address"}
            </Text>
          </Pressable>

          <Field
            label="Service Address"
            value={serviceAddress}
            onChangeText={setServiceAddress}
            placeholder="Door No, Street, Locality..."
            icon="location-outline"
          />

          <Field
            label="Work Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Broken Pipe Leak under Kitchen Sink"
            icon="hammer-outline"
          />

          <Field
            label="Problem Details & Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the problem, severity, and any tools required..."
            multiline
            icon="document-text-outline"
          />

          {/* Universal Media Attachment Component (Photo, Video & Documents) */}
          <UniversalMediaUploader
            title="Problem Photos, Videos & Document Attachments"
            attachments={mediaAttachments}
            onAddAttachment={(item) => setMediaAttachments((prev) => [...prev, item])}
            onRemoveAttachment={(id) => setMediaAttachments((prev) => prev.filter((a) => a.id !== id))}
          />

          <Field
            label="Offered Payout (₹)"
            value={price}
            onChangeText={setPrice}
            placeholder="Budget amount"
            keyboardType="phone-pad"
            icon="cash-outline"
          />

          <Pressable onPress={handlePostOrder} style={styles.continueButton}>
            <Text style={styles.continueButtonText}>Post Order Request</Text>
            <Ionicons name="send" size={16} color="#0F172A" />
          </Pressable>
        </View>
      )}

      {activeTab === "bids" && (
        <View style={styles.contentCard}>
          <Text style={styles.cardHeaderTitle}>Post Service Bidding Request</Text>
          <Text style={styles.cardSubText}>
            Describe your problem, preferred date/time, and photos/videos. Nearby verified workers will submit price proposals (minimum ₹200).
          </Text>

          {biddingSuccessMsg ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#34D399" />
              <Text style={styles.successBannerText}>{biddingSuccessMsg}</Text>
            </View>
          ) : null}

          <Text style={styles.fieldLabel}>Service Category</Text>
          <View style={styles.choiceGrid}>
            {["Electrical", "Plumbing", "Carpenter", "Painter", "Mason", "AC Repair"].map((cat) => (
              <Choice
                key={cat}
                label={cat}
                active={biddingCategory === cat}
                onPress={() => setBiddingCategory(cat)}
              />
            ))}
          </View>

          <Field
            label="Service Title"
            value={biddingTitle}
            onChangeText={setBiddingTitle}
            placeholder="e.g. Sub-distribution Circuit Breaker Panel Upgrade"
            icon="hammer-outline"
          />

          <Field
            label="Problem Description"
            value={biddingDesc}
            onChangeText={setBiddingDesc}
            placeholder="Describe the issue, tools needed, or repair urgency..."
            multiline
            icon="document-text-outline"
          />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Field
                label="Preferred Date"
                value={biddingDate}
                onChangeText={setBiddingDate}
                placeholder="Today / Tomorrow"
                icon="calendar-outline"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Preferred Time"
                value={biddingTime}
                onChangeText={setBiddingTime}
                placeholder="10:00 AM - 12:00 PM"
                icon="time-outline"
              />
            </View>
          </View>

          <Pressable onPress={handleAutoDetectGPS} style={styles.locationButton}>
            <Ionicons name="navigate" size={16} color="#E65100" />
            <Text style={styles.locationButtonText}>
              {detectingGps ? "Locating via Phone GPS..." : "📍 Auto-Detect Current GPS Address"}
            </Text>
          </Pressable>

          <Field
            label="Location"
            value={biddingLocation}
            onChangeText={setBiddingLocation}
            placeholder="Door No, Building, Area..."
            icon="location-outline"
          />

          <UniversalMediaUploader
            title="Problem Photos & Video Demonstration Attachments"
            attachments={biddingMedia}
            onAddAttachment={(item) => setBiddingMedia((prev) => [...prev, item])}
            onRemoveAttachment={(id) => setBiddingMedia((prev) => prev.filter((m) => m.id !== id))}
          />

          <Pressable onPress={handlePostBiddingRequest} style={styles.btnPrimarySaffron}>
            <Text style={styles.btnPrimarySaffronText}>POST REQUEST FOR WORKER BIDS</Text>
          </Pressable>

          {/* Incoming Worker Bids & Offers */}
          <Text style={[styles.cardHeaderTitle, { marginTop: 24 }]}>
            Incoming Worker Bids & Proposals ({bidOffers.length})
          </Text>

          {biddingRequests.map((req) => {
            const reqOffers = bidOffers.filter((o) => o.requestId === req.id);
            return (
              <View key={req.id} style={styles.biddingRequestCard}>
                <View style={styles.rowBetween}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{req.category.toUpperCase()}</Text>
                  </View>
                  <View style={styles.statusBadgePill}>
                    <Text style={styles.statusBadgeText}>{req.status}</Text>
                  </View>
                </View>

                <Text style={styles.orderTitleText}>{req.title}</Text>
                <Text style={styles.orderDescText}>{req.description}</Text>
                <Text style={styles.biddingMetaText}>
                  📅 {req.preferredDate} ({req.preferredTime}) • 📍 {req.location}
                </Text>

                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
                  Worker Proposals ({reqOffers.length})
                </Text>

                {reqOffers.length === 0 ? (
                  <Text style={styles.emptyText}>Waiting for nearby verified workers to submit bids...</Text>
                ) : (
                  reqOffers.map((offer) => (
                    <View key={offer.id} style={styles.workerOfferBox}>
                      <View style={styles.rowBetween}>
                        <View>
                          <Text style={styles.workerNameText}>{offer.workerName}</Text>
                          <Text style={styles.workerSubText}>
                            ⭐ {offer.workerRating} • {offer.workerExperience}
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={styles.proposedPriceText}>₹{offer.proposedPrice}</Text>
                          <Text style={styles.estTimeText}>Est: {offer.estimatedTime}</Text>
                        </View>
                      </View>

                      {offer.notes ? (
                        <Text style={styles.offerNotesText}>"{offer.notes}"</Text>
                      ) : null}

                      {offer.status === "pending" && (
                        <View style={styles.offerActionRow}>
                          <Pressable
                            onPress={() => handleRejectWorkerBid(offer.id)}
                            style={styles.modalCancelButtonFlex}
                          >
                            <Text style={styles.modalCancelText}>Reject</Text>
                          </Pressable>

                          <Pressable
                            onPress={() => handleAcceptWorkerBid(offer)}
                            style={styles.btnPrimarySaffronFlex}
                          >
                            <Text style={styles.btnPrimarySaffronText}>
                              ACCEPT OFFER (₹{offer.proposedPrice})
                            </Text>
                            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                          </Pressable>
                        </View>
                      )}

                      {offer.status === "accepted" && (
                        <View style={styles.acceptedBadgeBox}>
                          <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                          <Text style={styles.acceptedBadgeText}>Offer Accepted & Worker Assigned</Text>
                        </View>
                      )}

                      {offer.status === "expired" && (
                        <Text style={styles.expiredText}>Offer Expired</Text>
                      )}
                    </View>
                  ))
                )}
              </View>
            );
          })}
        </View>
      )}

      {activeTab === "teams" && (
        <View style={styles.contentCard}>
          <Text style={styles.cardHeaderTitle}>Dynamic Team-Based Projects ({teamProjects.length})</Text>
          <Text style={styles.cardSubText}>
            Large projects automatically form temporary worker teams, select a highly rated Team Leader, and submit a unified project quotation.
          </Text>

          {teamProjects.map((proj) => (
            <View key={proj.id} style={styles.teamProjectCard}>
              <View style={styles.rowBetween}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{proj.category.toUpperCase()}</Text>
                </View>
                <View style={styles.statusBadgePill}>
                  <Text style={styles.statusBadgeText}>{proj.status}</Text>
                </View>
              </View>

              <Text style={styles.orderTitleText}>{proj.title}</Text>
              <Text style={styles.orderDescText}>{proj.description}</Text>
              <Text style={styles.biddingMetaText}>
                👥 Required Team Size: {proj.requiredWorkerCount} Workers ({proj.joinedWorkers.length}/{proj.requiredWorkerCount} Joined)
              </Text>

              {/* Team Leader Badge & Profile */}
              {proj.leaderName ? (
                <View style={styles.teamLeaderBadgeCard}>
                  <Ionicons name="ribbon" size={20} color="#E65100" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teamLeaderTitle}>Auto-Selected Team Leader:</Text>
                    <Text style={styles.teamLeaderNameText}>{proj.leaderName}</Text>
                    <Text style={styles.teamLeaderSubText}>⭐ 4.9 Rating • 142 Jobs Completed • Verified Partner</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.teamFormationBanner}>
                  <Ionicons name="sync" size={18} color="#0284C7" />
                  <Text style={styles.teamFormationText}>
                    Team Formation In Progress... ({proj.joinedWorkers.length}/{proj.requiredWorkerCount} Workers Joined)
                  </Text>
                </View>
              )}

              {/* Team Members List */}
              {proj.joinedWorkers.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.fieldLabel}>Assembled Team Members:</Text>
                  {proj.joinedWorkers.map((mem) => (
                    <View key={mem.workerId} style={styles.teamMemberRow}>
                      <Ionicons name={mem.isLeader ? "ribbon" : "person-circle"} size={18} color={mem.isLeader ? "#E65100" : "#0284C7"} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.teamMemberNameText}>
                          {mem.workerName} {mem.isLeader ? "(Team Leader)" : ""}
                        </Text>
                        {mem.assignedTask ? (
                          <Text style={styles.teamTaskAssignedText}>Task: {mem.assignedTask}</Text>
                        ) : null}
                      </View>
                      <Text style={styles.teamMemberRatingText}>⭐ {mem.rating}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Leader Quotation Card */}
              {proj.quotedPrice ? (
                <View style={styles.quotationSummaryCard}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.quotationTitleText}>Leader Project Quotation:</Text>
                    <Text style={styles.proposedPriceText}>₹{proj.quotedPrice.toLocaleString("en-IN")}</Text>
                  </View>
                  <Text style={styles.workerSubText}>Estimated Duration: {proj.estimatedDuration || "3 Days"}</Text>
                  {proj.quotationNotes ? (
                    <Text style={styles.offerNotesText}>"{proj.quotationNotes}"</Text>
                  ) : null}

                  {proj.status === "Quotation Sent" && (
                    <Pressable
                      onPress={() => handleAcceptTeamQuotation(proj.id)}
                      style={[styles.btnPrimarySaffron, { marginTop: 12 }]}
                    >
                      <Text style={styles.btnPrimarySaffronText}>
                        ACCEPT QUOTATION (₹{proj.quotedPrice.toLocaleString("en-IN")})
                      </Text>
                    </Pressable>
                  )}

                  {proj.status === "Quotation Accepted" && (
                    <View style={styles.acceptedBadgeBox}>
                      <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                      <Text style={styles.acceptedBadgeText}>Quotation Accepted & Team Assigned</Text>
                    </View>
                  )}
                </View>
              ) : null}

              {/* Group Team Chat */}
              {proj.chatMessages.length > 0 && (
                <View style={styles.teamChatBox}>
                  <Text style={styles.fieldLabel}>Team Project Group Chat</Text>
                  {proj.chatMessages.map((msg) => (
                    <View key={msg.id} style={styles.chatMessageItem}>
                      <Text style={styles.chatSenderNameText}>{msg.senderName}:</Text>
                      <Text style={styles.chatTextContent}>{msg.text}</Text>
                      <Text style={styles.chatTimeText}>{msg.timestamp}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {activeTab === "workers" && (
        <View style={styles.contentCard}>
          <Text style={styles.cardHeaderTitle}>Local Workers in {userCity}</Text>
          <Text style={styles.cardSubText}>
            Showing all registered workers in your city. Online and offline workers can choose to accept your order.
          </Text>

          {cityWorkers.map((worker) => (
            <View key={worker.id} style={styles.workerListItem}>
              <View style={styles.workerAvatarCircle}>
                <Ionicons name="person" size={22} color="#FF6B00" />
              </View>

              <View style={styles.workerDetails}>
                <View style={styles.rowBetween}>
                  <Text style={styles.workerNameText}>{worker.name}</Text>
                  <View style={[styles.statusBadgePill, worker.isOnline ? styles.badgeOnline : styles.badgeOffline]}>
                    <View style={[styles.smallStatusDot, worker.isOnline ? styles.dotGreen : styles.dotGrey]} />
                    <Text style={[styles.statusBadgeText, worker.isOnline ? styles.textGreen : styles.textGrey]}>
                      {worker.isOnline ? "Online" : "Offline"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.workerTradeText}>{worker.trade}</Text>

                <View style={styles.workerMetaRow}>
                  <Text style={styles.workerMetaText}>📍 {worker.distance}</Text>
                  <Text style={styles.workerMetaText}>★ {worker.rating} ({worker.reviewsCount})</Text>
                  <Text style={styles.workerPriceText}>{money(worker.dailyRate)}/day</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {activeTab === "myorders" && (
        <View style={styles.contentCard}>
          <Text style={styles.cardHeaderTitle}>My Service Requests</Text>

          {orders.map((order) => (
            <View key={order.id} style={styles.orderCardItem}>
              <View style={styles.rowBetween}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{order.category.toUpperCase()}</Text>
                </View>
                <View style={[styles.orderStatusPill, order.status === "completed" ? styles.statusCompleted : order.status === "assigned" ? styles.statusAssigned : styles.statusOpen]}>
                  <Text style={styles.orderStatusText}>
                    {order.status === "completed" ? "Completed" : order.status === "assigned" ? "Worker Assigned" : "Open Request"}
                  </Text>
                </View>
              </View>

              <Text style={styles.orderTitleText}>{order.title}</Text>
              <Text style={styles.orderDescText}>{order.description}</Text>

              {order.hasPhoto && (
                <View style={styles.photoAttachedBadge}>
                  <Ionicons name="image-outline" size={15} color="#38BDF8" />
                  <Text style={styles.photoAttachedText}>Problem Photo Attached</Text>
                </View>
              )}

              <View style={styles.orderMetaFooter}>
                <Text style={styles.orderPriceText}>{money(order.price)} Payout</Text>
                <Text style={styles.orderLocalityText}>📍 {order.locality}</Text>
              </View>

              {order.status === "completed" && (
                <View style={styles.ratingSection}>
                  <Pressable
                    onPress={() => Linking.openURL(`upi://pay?pa=shramsangam@ybl&pn=Shram%20Sangam&am=${order.price}&cu=INR`).catch(() => alert("No UPI App Found on this device."))}
                    style={[styles.btnPrimarySaffron, { marginTop: 10, paddingVertical: 10 }]}
                  >
                    <Text style={styles.btnPrimarySaffronText}>Secure Pay {money(order.price)} via UPI</Text>
                  </Pressable>
                  {order.rating ? (
                    <View style={styles.ratingDisplayRow}>
                      <Text style={styles.starsText}>{"★".repeat(order.rating)}</Text>
                      <Text style={styles.ratingCommentText}>"{order.comment}"</Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => setRatingOrder(order)}
                      style={styles.rateServiceButton}
                    >
                      <Ionicons name="star" size={16} color="#FF6B00" />
                      <Text style={styles.rateServiceButtonText}>Give Rating & Feedback</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {ratingOrder && (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rate Your Service</Text>
            <Text style={styles.modalSub}>
              How was your experience for "{ratingOrder.title}"?
            </Text>

            <View style={styles.starsPickerRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => setSelectedStars(star)}>
                  <Ionicons
                    name={star <= selectedStars ? "star" : "star-outline"}
                    size={32}
                    color="#FF6B00"
                  />
                </Pressable>
              ))}
            </View>

            <Field
              label="Feedback & Comment"
              value={feedbackComment}
              onChangeText={setFeedbackComment}
              placeholder="Write your experience..."
              multiline
              icon="chatbox-ellipses-outline"
            />

            <View style={styles.modalActionsRow}>
              <Pressable onPress={() => setRatingOrder(null)} style={styles.modalCancelButton}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSubmitRating} style={styles.continueButton}>
                <Text style={styles.continueButtonText}>Submit Review</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// WORKER LIVE LOCATION DISPATCH TRACKER COMPONENT
function LiveLocationDispatchTracker({
  userCity,
  onLocationUpdate,
}: {
  userCity: string;
  onLocationUpdate?: (locationStr: string) => void;
}) {
  const [liveGpsActive, setLiveGpsActive] = useState(true);
  const [lastUpdatedTime, setLastUpdatedTime] = useState("Just now");
  const [gpsData, setGpsData] = useState<{
    latitude: number;
    longitude: number;
    locality: string;
    city: string;
    accuracy: number;
  }>({
    latitude: 12.9141,
    longitude: 77.6412,
    locality: "HSR Layout, Sector 2",
    city: userCity || "Bengaluru",
    accuracy: 4,
  });

  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshGps = async () => {
    setRefreshing(true);
    const loc = await fetchCurrentDeviceLocation();
    if (loc) {
      setGpsData({
        latitude: loc.latitude,
        longitude: loc.longitude,
        locality: loc.locality,
        city: loc.city,
        accuracy: 4,
      });
      setLastUpdatedTime("Just now");
      if (onLocationUpdate) {
        onLocationUpdate(`${loc.locality}, ${loc.city}`);
      }
    }
    setRefreshing(false);
  };

  useEffect(() => {
    let watchSubscription: Location.LocationSubscription | null = null;

    async function startLiveWatch() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted" && liveGpsActive) {
          watchSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 10000,
              distanceInterval: 10,
            },
            (location) => {
              setGpsData((prev) => ({
                ...prev,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: Math.round(location.coords.accuracy || 4),
              }));
              setLastUpdatedTime("Live GPS active");
            },
          );
        }
      } catch (err) {
        console.log("Live watch error:", err);
      }
    }

    startLiveWatch();

    return () => {
      if (watchSubscription) {
        watchSubscription.remove();
      }
    };
  }, [liveGpsActive]);

  return (
    <View style={styles.contentCard}>
      <View style={styles.rowBetween}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
          <View style={styles.liveGpsPulseCircle}>
            <View style={[styles.liveGpsPulseDot, liveGpsActive ? styles.pulseGreen : styles.pulseGrey]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardHeaderTitle}>Live GPS Location Tracker</Text>
            <Text style={styles.cardSubText}>
              {liveGpsActive
                ? "🟢 Broadcasting Live GPS coordinates to nearby customer dispatches"
                : "⚪ Live GPS paused"}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => setLiveGpsActive(!liveGpsActive)}
          style={[styles.gpsTogglePillBtn, liveGpsActive ? styles.gpsActivePill : styles.gpsInactivePill]}
        >
          <Text style={[styles.gpsTogglePillText, liveGpsActive ? styles.gpsActiveText : styles.gpsInactiveText]}>
            {liveGpsActive ? "Live GPS On" : "Paused"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.gpsCoordBoxShell}>
        <Ionicons name="navigate-circle" size={24} color="#E65100" />
        <View style={{ flex: 1 }}>
          <Text style={styles.gpsLocationTitleText}>📍 {gpsData.locality}, {gpsData.city}</Text>
          <Text style={styles.gpsLocationCoordsText}>
            Lat: {gpsData.latitude.toFixed(4)}° N, Long: {gpsData.longitude.toFixed(4)}° E (±{gpsData.accuracy}m GPS Precision)
          </Text>
          <Text style={styles.gpsLastUpdateText}>Status: {lastUpdatedTime}</Text>
        </View>

        <Pressable onPress={handleRefreshGps} style={styles.refreshGpsButton}>
          <Ionicons
            name="sync-circle"
            size={22}
            color="#E65100"
            style={refreshing ? { transform: [{ rotate: "180deg" }] } : {}}
          />
        </Pressable>
      </View>
    </View>
  );
}

// WORKER BID SUBMIT MODAL
function WorkerBidSubmitModal({
  request,
  onSubmitBid,
  onClose,
}: {
  request: BiddingRequest;
  onSubmitBid: (price: number, estTime: string, notes: string) => void;
  onClose: () => void;
}) {
  const [proposedPrice, setProposedPrice] = useState("350");
  const [estTime, setEstTime] = useState("1.5 Hours");
  const [notes, setNotes] = useState("I carry standard Schneider MCB replacements and insulated tool kit.");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = () => {
    const numPrice = parseInt(proposedPrice) || 0;
    if (numPrice < 200) {
      setErrorMsg("❌ Minimum allowed proposal price is ₹200. System does not allow bids below ₹200.");
      return;
    }
    setErrorMsg("");
    onSubmitBid(numPrice, estTime, notes);
    onClose();
  };

  return (
    <View style={styles.modalBackdrop}>
      <View style={styles.whatsappOtpModalCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.modalTitle}>Submit Price Proposal</Text>
          <Pressable onPress={onClose} style={styles.closeIconButton}>
            <Ionicons name="close" size={22} color="#1C1C1E" />
          </Pressable>
        </View>

        <Text style={styles.modalSub}>
          Job: <Text style={{ fontWeight: "800", color: "#1C1C1E" }}>{request.title}</Text>
        </Text>

        <Field
          label="Proposed Price (₹) • Minimum Allowed: ₹200"
          value={proposedPrice}
          onChangeText={setProposedPrice}
          placeholder="Enter proposed price (Min ₹200)"
          keyboardType="phone-pad"
          icon="cash-outline"
        />

        {errorMsg ? (
          <View style={styles.formError}>
            <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
            <Text style={styles.formErrorText}>{errorMsg}</Text>
          </View>
        ) : null}

        <Field
          label="Estimated Completion Time"
          value={estTime}
          onChangeText={setEstTime}
          placeholder="e.g. 1.5 Hours, 45 Mins"
          icon="time-outline"
        />

        <Field
          label="Notes / Service Guarantee"
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. Include 30-day warranty, tools included..."
          multiline
          icon="document-text-outline"
        />

        <View style={styles.modalActionsRow}>
          <Pressable onPress={onClose} style={styles.modalCancelButtonFlex}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </Pressable>

          <Pressable onPress={handleSubmit} style={styles.btnPrimarySaffronFlex}>
            <Text style={styles.btnPrimarySaffronText}>SUBMIT PROPOSAL</Text>
            <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// INLINE WORKER PROPOSAL INPUT BOX
function WorkerInlineBidBox({
  request,
  onSubmitBid,
}: {
  request: BiddingRequest;
  onSubmitBid: (price: number, estTime: string, notes: string) => void;
}) {
  const [proposedPrice, setProposedPrice] = useState("350");
  const [estTime, setEstTime] = useState("1.5 Hours");
  const [notes, setNotes] = useState("Includes standard diagnostic & tools");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = () => {
    const numPrice = parseInt(proposedPrice) || 0;
    if (numPrice < 200) {
      setErrorMsg("❌ Minimum allowed proposal price is ₹200. Bids below ₹200 are not allowed.");
      return;
    }
    setErrorMsg("");
    onSubmitBid(numPrice, estTime, notes);
  };

  return (
    <View style={styles.inlineBidInputCard}>
      <Text style={styles.fieldLabel}>Enter Your Price Proposal (₹) • Minimum Allowed: ₹200</Text>
      <View style={styles.phoneInputBoxShell}>
        <Text style={styles.countryCodeText}>₹</Text>
        <TextInput
          value={proposedPrice}
          onChangeText={setProposedPrice}
          placeholder="Enter proposed price (Min ₹200)"
          keyboardType="phone-pad"
          style={styles.phoneInputBold}
        />
      </View>

      {errorMsg ? (
        <View style={styles.formError}>
          <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
          <Text style={styles.formErrorText}>{errorMsg}</Text>
        </View>
      ) : null}

      <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>Est. Time</Text>
          <TextInput
            value={estTime}
            onChangeText={setEstTime}
            placeholder="e.g. 1.5 Hours"
            style={styles.inlineEstInput}
          />
        </View>

        <View style={{ flex: 1.5 }}>
          <Text style={styles.fieldLabel}>Service Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Includes warranty"
            style={styles.inlineEstInput}
          />
        </View>
      </View>

      <Pressable onPress={handleSubmit} style={[styles.btnPrimarySaffron, { marginTop: 12, marginBottom: 0 }]}>
        <Text style={styles.btnPrimarySaffronText}>SUBMIT PROPOSAL NOW (₹{proposedPrice || "200"})</Text>
      </Pressable>
    </View>
  );
}

// WORKER SECTION COMPONENT
function WorkerSection({
  userData,
  orders,
  setOrders,
  isOnline,
  setIsOnline,
  workerBadges,
  trustScore,
  onOpenVerification,
  biddingRequests,
  setBiddingRequests,
  bidOffers,
  setBidOffers,
  notifications,
  setNotifications,
}: {
  userData: OnboardingData;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  isOnline: boolean;
  setIsOnline: (val: boolean) => void;
  workerBadges: string[];
  trustScore: number;
  onOpenVerification: () => void;
  biddingRequests: BiddingRequest[];
  setBiddingRequests: React.Dispatch<React.SetStateAction<BiddingRequest[]>>;
  bidOffers: WorkerBidOffer[];
  setBidOffers: React.Dispatch<React.SetStateAction<WorkerBidOffer[]>>;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
}) {
  const [workerTab, setWorkerTab] = useState<"dispatch" | "bids">("dispatch");
  const [activeBidRequest, setActiveBidRequest] = useState<BiddingRequest | null>(null);

  const workerCity = userData.city || "Live Location";

  const cityOrders = orders.filter((o) => o.status === "open");
  const myAssignedOrders = orders.filter((o) => o.status === "assigned" || o.status === "completed");

  // SUPABASE REALTIME WEBSOCKET SIMULATION
  useEffect(() => {
    let channel: any = null;
    try {
      const { supabase } = require("./supabaseClient");
      if (supabase && isOnline) {
        console.log("Subscribing to Supabase Realtime for PostGIS 3km Geofence Dispatches...");
        channel = supabase
          .channel("public:bidding_requests")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "bidding_requests" },
            (payload: any) => {
              console.log("Supabase Realtime Push Received!", payload);
              // In live DB mode: setBiddingRequests(prev => [payload.new, ...prev]);
            }
          )
          .subscribe();
      }
    } catch (e) {
      // Supabase not yet configured with real API keys
    }

    return () => {
      if (channel && typeof channel.unsubscribe === "function") {
        channel.unsubscribe();
      }
    };
  }, [isOnline]);

  const handleWorkerSubmitBid = (requestId: string, price: number, estTime: string, notes: string) => {
    const request = biddingRequests.find((r) => r.id === requestId);
    if (!request) return;

    const existingIndex = bidOffers.findIndex(
      (o) => o.requestId === requestId && o.workerId === "w-1",
    );

    const newOffer: WorkerBidOffer = {
      id: `offer-${Date.now().toString().slice(-4)}`,
      requestId: requestId,
      workerId: "w-1",
      workerName: userData.fullName || "Ramesh Kumar",
      workerRating: 4.9,
      workerExperience: "8 Years Exp • Verified Partner",
      proposedPrice: price, // Minimum ₹200 enforced
      estimatedTime: estTime,
      notes,
      status: "pending",
      createdAt: "Just now",
    };

    if (existingIndex >= 0) {
      setBidOffers((prev) =>
        prev.map((o, idx) => (idx === existingIndex ? newOffer : o)),
      );
    } else {
      setBidOffers((prev) => [newOffer, ...prev]);
    }

    setBiddingRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "Offer Sent" } : r)),
    );

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: "💬 Proposal Received",
        message: `${userData.fullName || "Ramesh Kumar"} submitted a ₹${price} proposal for '${request.title}'.`,
        timestamp: "Just now",
        type: "offer",
        read: false,
      },
      ...prev,
    ]);
  };

  const handleAcceptJob = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: "assigned", assignedWorkerName: userData.fullName || "Ramesh Kumar" }
          : o,
      ),
    );
  };

  const handleCompleteJob = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "completed" } : o)),
    );
  };

  return (
    <View style={styles.sectionContainer}>
      {/* Live GPS Location Dispatch Tracker */}
      <LiveLocationDispatchTracker userCity={workerCity} />

      {/* Screen 5: Worker Dashboard Overview Header */}
      <View style={styles.contentCard}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.yourDayTitleText}>Your Day:</Text>
            <View style={styles.locationSelectorRow}>
              <Text style={styles.locationSelectorText}>📍 {userData.address || workerCity}</Text>
            </View>
          </View>

          <View style={styles.rowBetween}>
            <Pressable
              onPress={() => setIsOnline(!isOnline)}
              style={[styles.onlineToggleButton, isOnline ? styles.btnOnline : styles.btnOffline]}
            >
              <View style={[styles.smallStatusDot, isOnline ? styles.dotGreen : styles.dotGrey]} />
              <Text style={styles.onlineToggleText}>{isOnline ? "Online" : "Offline"}</Text>
            </Pressable>
          </View>
        </View>

        {/* Filters Row */}
        <View style={styles.filtersRow}>
          <Pressable style={styles.filterChipBtn}>
            <Ionicons name="options-outline" size={14} color="#94A3B8" />
            <Text style={styles.filterChipText}>Filters</Text>
          </Pressable>
          <Pressable style={styles.filterChipBtn}>
            <Text style={styles.filterChipText}>Filters</Text>
            <Ionicons name="chevron-down" size={14} color="#94A3B8" />
          </Pressable>
        </View>
      </View>

      <View style={styles.statGrid}>
        <View style={styles.statBox}>
          <Ionicons name="cash-outline" size={20} color="#FF6B00" />
          <Text style={styles.statValue}>{money(18400)}</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="hammer-outline" size={20} color="#38BDF8" />
          <Text style={styles.statValue}>27</Text>
          <Text style={styles.statLabel}>Jobs Done</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="sparkles-outline" size={20} color="#34D399" />
          <Text style={styles.statValue}>1,840</Text>
          <Text style={styles.statLabel}>Patronage Points</Text>
        </View>
      </View>

      {/* Demand Map & Heatmap Zone Card */}
      <View style={styles.contentCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardHeaderTitle}>🔥 Demand Hotspots in {workerCity}</Text>
          <View style={styles.surgeTagPill}>
            <Text style={styles.surgeTagText}>+₹30/trip Surge</Text>
          </View>
        </View>

        <Text style={styles.cardSubText}>
          High demand zone detected near HSR Layout & Sector 18. Head to this area for faster order assignments.
        </Text>

        <View style={styles.heatmapBox}>
          <Ionicons name="map-outline" size={24} color="#FFB300" />
          <View style={{ flex: 1 }}>
            <Text style={styles.heatmapTitleText}>Sector 18 & Koramangala Zone</Text>
            <Text style={styles.heatmapDetailText}>Predicted Peak Demand: 5:00 PM – 7:30 PM</Text>
          </View>
          <Pressable style={styles.navigateZoneButton}>
            <Text style={styles.navigateZoneText}>Navigate</Text>
          </Pressable>
        </View>
      </View>

      {/* Persistent Safety & Emergency Dock */}
      <View style={styles.safetyDockCard}>
        <Text style={styles.safetyDockTitle}>Partner Safety & Support Dock</Text>
        <View style={styles.safetyDockRow}>
          <Pressable style={styles.sosButton} onPress={() => Linking.openURL('tel:112')}>
            <Ionicons name="warning" size={16} color="#FFFFFF" />
            <Text style={styles.sosButtonText}>🚨 SOS Emergency</Text>
          </Pressable>

          <Pressable style={styles.safetyHelpButton} onPress={() => Linking.openURL('sms:112?body=I%20Need%20Live%20Help%20(Shram%20Sangam)')}>
            <Ionicons name="chatbubbles-outline" size={16} color="#38BDF8" />
            <Text style={styles.safetyHelpText}>Live Help</Text>
          </Pressable>

          <Pressable style={styles.safetyHelpButton} onPress={() => Linking.openURL('sms:112?body=Vehicle%20Breakdown%20(Shram%20Sangam)')}>
            <Ionicons name="construct-outline" size={16} color="#34D399" />
            <Text style={styles.safetyHelpText}>Breakdown</Text>
          </Pressable>
        </View>
      </View>

      {/* 90/7/3 CO-OP DIGITAL WALLET COMPONENT */}
      <View style={styles.walletCard}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.walletTitleText}>Digital Co-op Wallet</Text>
            <Text style={styles.walletSubText}>Your total lifetime earnings & mutual aid benefits.</Text>
          </View>
          <Ionicons name="wallet" size={28} color="#16A34A" />
        </View>

        <View style={styles.walletBalanceBox}>
          <Text style={styles.walletBalanceLabel}>Total Escrow Disbursed (90% Direct UPI)</Text>
          <Text style={styles.walletBalanceText}>{money(18400)}</Text>
        </View>

        <View style={styles.splitRow}>
          <View style={styles.splitItem}>
            <Text style={styles.splitValText}>{money(Math.round(18400 * 0.03))}</Text>
            <Text style={styles.splitLblText}>Mutual Aid Fund (3%)</Text>
            <Text style={styles.splitSubText}>Insurance & Tools</Text>
          </View>

          <View style={styles.splitItemLine} />

          <View style={styles.splitItem}>
            <Text style={styles.splitValText}>{money(Math.round(18400 * 0.07))}</Text>
            <Text style={styles.splitLblText}>Co-op Operations (7%)</Text>
            <Text style={styles.splitSubText}>Servers & Fees</Text>
          </View>
        </View>
      </View>

      {/* TABS TRANSFERRED TO HAMBURGER MENU */}

      {workerTab === "bids" && (
        <View style={styles.contentCard}>
          <Text style={styles.cardHeaderTitle}>Incoming Bidding Requests ({biddingRequests.length})</Text>
          <Text style={styles.cardSubText}>
            Review customer requests and enter your proposed amount (minimum ₹200).
          </Text>

          {biddingRequests.map((req) => {
            const myOffer = bidOffers.find(
              (o) => o.requestId === req.id && o.workerId === "w-1",
            );
            return (
              <View key={req.id} style={styles.jobFeedCard}>
                <View style={styles.rowBetween}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{req.category.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.distanceBadgeText}>📍 {req.location}</Text>
                </View>

                <Text style={styles.orderTitleText}>{req.title}</Text>
                <Text style={styles.orderDescText}>{req.description}</Text>
                <Text style={styles.biddingMetaText}>
                  📅 Preferred: {req.preferredDate} ({req.preferredTime})
                </Text>

                {myOffer ? (
                  <View style={styles.mySubmittedOfferBox}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.submittedOfferTitle}>Your Proposal Submitted:</Text>
                      <Text style={styles.proposedPriceText}>₹{myOffer.proposedPrice}</Text>
                    </View>
                    <Text style={styles.workerSubText}>Est Time: {myOffer.estimatedTime}</Text>
                    <View style={styles.acceptedBadgeBox}>
                      <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                      <Text style={styles.acceptedBadgeText}>Status: {myOffer.status.toUpperCase()}</Text>
                    </View>
                  </View>
                ) : (
                  <WorkerInlineBidBox
                    request={req}
                    onSubmitBid={(price, estTime, notes) => handleWorkerSubmitBid(price, estTime, notes)}
                  />
                )}
              </View>
            );
          })}
        </View>
      )}

      {activeBidRequest && (
        <WorkerBidSubmitModal
          request={activeBidRequest}
          onSubmitBid={handleWorkerSubmitBid}
          onClose={() => setActiveBidRequest(null)}
        />
      )}

      {workerTab === "dispatch" && (
        <View>
          <View style={styles.contentCard}>
            <Text style={styles.cardHeaderTitle}>Nearby Customer Requests in {workerCity}</Text>
            <Text style={styles.cardSubText}>
              Orders placed by customers near your location. You have full choice to accept any request.
            </Text>

            {cityOrders.length === 0 ? (
              <Text style={styles.emptyText}>No open customer orders in your area right now.</Text>
            ) : (
              cityOrders.map((order) => (
                <View key={order.id} style={styles.jobFeedCard}>
                  <View style={styles.rowBetween}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{order.category.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.distanceBadgeText}>📍 {order.locality} · {order.createdAt}</Text>
                  </View>

                  <Text style={styles.orderTitleText}>{order.title}</Text>
                  <Text style={styles.orderDescText}>{order.description}</Text>

                  {order.hasPhoto && (
                    <View style={styles.photoAttachedBadge}>
                      <Ionicons name="camera-outline" size={15} color="#38BDF8" />
                      <Text style={styles.photoAttachedText}>Customer Problem Photo Attached</Text>
                    </View>
                  )}

                  <View style={styles.jobFooterRow}>
                    <View>
                      <Text style={styles.mutedText}>Payout Amount</Text>
                      <Text style={styles.jobPriceText}>{money(order.price)}</Text>
                    </View>

                    <Pressable
                      onPress={() => handleAcceptJob(order.id)}
                      style={styles.acceptJobButton}
                    >
                      <Text style={styles.acceptJobButtonText}>Accept Job</Text>
                      <Ionicons name="checkmark" size={16} color="#0F172A" />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {myAssignedOrders.length > 0 && (
        <View style={styles.contentCard}>
          <Text style={styles.cardHeaderTitle}>My Accepted Jobs</Text>

          {myAssignedOrders.map((job) => (
            <View key={job.id} style={styles.activeJobItem}>
              <Text style={styles.orderTitleText}>{job.title}</Text>
              <Text style={styles.orderDescText}>Location: {job.locality}</Text>
              <Text style={styles.jobPriceText}>{money(job.price)}</Text>

              {job.status === "assigned" ? (
                <Pressable
                  onPress={() => handleCompleteJob(job.id)}
                  style={styles.completeJobButton}
                >
                  <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                  <Text style={styles.completeJobButtonText}>Mark Job Completed</Text>
                </Pressable>
              ) : (
                <View style={styles.completedBadgePill}>
                  <Ionicons name="checkmark-circle" size={16} color="#34D399" />
                  <Text style={styles.completedBadgeText}>Job Completed & Paid</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// COMPANY SECTION COMPONENT
function CompanySection({
  userData,
  workers,
  projects,
  setProjects,
}: {
  userData: OnboardingData;
  workers: WorkerProfile[];
  projects: GroupProject[];
  setProjects: React.Dispatch<React.SetStateAction<GroupProject[]>>;
}) {
  const [hireMode, setHireMode] = useState<"single" | "group">("single");

  const [projName, setProjName] = useState("");
  const [projCategory, setProjCategory] = useState("Electrical");
  const [teamSize, setTeamSize] = useState("6");
  const [budget, setBudget] = useState("75000");
  const [duration, setDuration] = useState("8");
  const [projDesc, setProjDesc] = useState("");
  const [projectSuccessMsg, setProjectSuccessMsg] = useState("");

  const handlePostGroupProject = () => {
    if (!projName || !projDesc) return;
    const newProj: GroupProject = {
      id: `proj-${Date.now()}`,
      projectName: projName,
      category: projCategory,
      teamSizeRequired: parseInt(teamSize) || 5,
      city: userData.city || "Bengaluru",
      budget: parseInt(budget) || 50000,
      durationDays: parseInt(duration) || 7,
      description: projDesc,
      status: "active",
    };
    setProjects((prev) => [newProj, ...prev]);
    setProjName("");
    setProjDesc("");
    setProjectSuccessMsg(`Group Project "${projName}" posted for a team of ${teamSize} workers!`);
    setTimeout(() => setProjectSuccessMsg(""), 4000);
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.heroTitleText}>Company Hiring Portal</Text>
      <Text style={styles.heroSubText}>
        Hire individual specialists or contract a group team of workers for big commercial projects.
      </Text>

      <View style={styles.segmentedContainer}>
        <Pressable
          onPress={() => setHireMode("single")}
          style={[
            styles.segmentedTab,
            hireMode === "single" && styles.segmentedTabActive,
          ]}
        >
          <Ionicons
            name="person"
            size={16}
            color={hireMode === "single" ? "#0F172A" : "#94A3B8"}
          />
          <Text
            style={[
              styles.segmentedTabText,
              hireMode === "single" && styles.segmentedTabTextActive,
            ]}
          >
            Hire Single Person
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setHireMode("group")}
          style={[
            styles.segmentedTab,
            hireMode === "group" && styles.segmentedTabActive,
          ]}
        >
          <Ionicons
            name="people"
            size={16}
            color={hireMode === "group" ? "#0F172A" : "#94A3B8"}
          />
          <Text
            style={[
              styles.segmentedTabText,
              hireMode === "group" && styles.segmentedTabTextActive,
            ]}
          >
            Hire Group / Team Project
          </Text>
        </Pressable>
      </View>

      {hireMode === "single" && (
        <View style={styles.contentCard}>
          <Text style={styles.cardHeaderTitle}>Certified Specialists in {userData.city || "Bengaluru"}</Text>
          <Text style={styles.cardSubText}>
            Directly hire individual verified specialists for specific jobs or tasks.
          </Text>

          {workers.map((worker) => (
            <View key={worker.id} style={styles.workerListItem}>
              <View style={styles.workerAvatarCircle}>
                <Ionicons name="person" size={22} color="#FF6B00" />
              </View>

              <View style={styles.workerDetails}>
                <View style={styles.rowBetween}>
                  <Text style={styles.workerNameText}>{worker.name}</Text>
                  <Text style={styles.workerPriceText}>{money(worker.dailyRate)}/day</Text>
                </View>

                <Text style={styles.workerTradeText}>{worker.trade}</Text>

                <View style={styles.workerMetaRow}>
                  <Text style={styles.workerMetaText}>★ {worker.rating} ({worker.reviewsCount})</Text>
                  <Text style={styles.workerMetaText}>📍 {worker.locality}</Text>
                </View>

                <Pressable style={styles.hireSpecialistButton}>
                  <Text style={styles.hireSpecialistText}>Hire Specialist</Text>
                  <Ionicons name="arrow-forward" size={14} color="#0F172A" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {hireMode === "group" && (
        <View style={styles.contentCard}>
          <Text style={styles.cardHeaderTitle}>Create Group Team Contract</Text>
          <Text style={styles.cardSubText}>
            Post big commercial projects requiring a team of 3 to 20 workers.
          </Text>

          {projectSuccessMsg ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#34D399" />
              <Text style={styles.successBannerText}>{projectSuccessMsg}</Text>
            </View>
          ) : null}

          <Field
            label="Project Name"
            value={projName}
            onChangeText={setProjName}
            placeholder="e.g. Commercial Office Electrical Wiring"
            icon="business-outline"
          />

          <Field
            label="Required Team Size (Workers)"
            value={teamSize}
            onChangeText={setTeamSize}
            placeholder="e.g. 6"
            keyboardType="phone-pad"
            icon="people-outline"
          />

          <Field
            label="Total Project Budget (₹)"
            value={budget}
            onChangeText={setBudget}
            placeholder="e.g. 75000"
            keyboardType="phone-pad"
            icon="cash-outline"
          />

          <Field
            label="Estimated Duration (Days)"
            value={duration}
            onChangeText={setDuration}
            placeholder="e.g. 8"
            keyboardType="phone-pad"
            icon="calendar-outline"
          />

          <Field
            label="Project Details & Scope"
            value={projDesc}
            onChangeText={setProjDesc}
            placeholder="Describe the scope of work, technical requirements, and materials provided..."
            multiline
            icon="document-text-outline"
          />

          <Pressable onPress={handlePostGroupProject} style={styles.continueButton}>
            <Text style={styles.continueButtonText}>Post Group Project Contract</Text>
            <Ionicons name="briefcase" size={16} color="#0F172A" />
          </Pressable>

          <Text style={[styles.cardHeaderTitle, { marginTop: 28 }]}>Active Group Contracts</Text>

          {projects.map((proj) => (
            <View key={proj.id} style={styles.projectCardItem}>
              <View style={styles.rowBetween}>
                <View style={styles.teamBadgePill}>
                  <Ionicons name="people" size={14} color="#FF6B00" />
                  <Text style={styles.teamBadgeText}>Team of {proj.teamSizeRequired} Required</Text>
                </View>
                <Text style={styles.projectBudgetText}>{money(proj.budget)}</Text>
              </View>

              <Text style={styles.orderTitleText}>{proj.projectName}</Text>
              <Text style={styles.orderDescText}>{proj.description}</Text>

              <View style={styles.projectFooterRow}>
                <Text style={styles.mutedText}>⏱️ {proj.durationDays} Days Duration</Text>
                <Text style={styles.mutedText}>📍 {proj.city}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// AI ASSISTANT MODAL COMPONENT (BHASHINI AI & GEMINI INTEGRATION)
function AIAssistantModal({
  onClose,
  activeRole,
}: {
  onClose: () => void;
  activeRole: Role;
}) {
  const [query, setQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<
    { sender: "ai" | "user"; text: string }[]
  >([
    {
      sender: "ai",
      text: "Namaste! I am your Shram Sangam Voice & AI Assistant powered by Sarvam AI. How can I help you today?",
    },
  ]);

  const playSarvamTTS = async (textToSpeak: string) => {
    try {
      const apiKey = "sk_wi1213h9_6Q5JLi1ADrmyM9g6e4i67JqI";
      const res = await fetch("https://api.sarvam.ai/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-subscription-key": apiKey,
        },
        body: JSON.stringify({
          text: textToSpeak,
          language_code: "hi-IN", // Hindi fallback for TTS
          model: "bulbul:v3",
          speaker: "shubh",
        }),
      });
      const data = await res.json();
      if (data.audios && data.audios.length > 0) {
        const uri = FileSystem.cacheDirectory + `tts_${Date.now()}.wav`;
        await FileSystem.writeAsStringAsync(uri, data.audios[0], {
          encoding: FileSystem.EncodingType.Base64,
        });
        const { sound } = await Audio.Sound.createAsync({ uri });
        await sound.playAsync();
      }
    } catch (e) {
      console.log("TTS Error:", e);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || query;
    if (!text.trim()) return;

    const userMsg = { sender: "user" as const, text };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");

    // Real AI Integration with Sarvam 105B Conversations
    try {
      const apiKey = "sk_wi1213h9_6Q5JLi1ADrmyM9g6e4i67JqI";
      const payload = {
        messages: [
          { role: "system", content: "You are an AI assistant for gig workers on the Shram Sangam platform in India. Answer concisely." },
          { role: "user", content: text }
        ],
        model: "sarvam-105b-conversations",
        temperature: 0.6,
        max_tokens: 150
      };

      const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-subscription-key": apiKey
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data && data.choices && data.choices.length > 0) {
        const aiText = data.choices[0].message.content;
        setMessages((prev) => [...prev, { sender: "ai", text: aiText }]);
        // Automatically play the response via TTS
        playSarvamTTS(aiText);
      } else {
        throw new Error("Invalid response from Sarvam");
      }
    } catch (err) {
      console.log("AI Error:", err);
      setMessages((prev) => [...prev, { sender: "ai", text: "I'm having trouble reaching the Sarvam AI server right now." }]);
    }
  };

  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsListening(true);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    setRecording(null);
    setIsListening(false);
    try {
      await recording?.stopAndUnloadAsync();
      const uri = recording?.getURI();
      if (uri) {
        // Send to Sarvam STT
        setQuery("Transcribing audio...");
        const formData = new FormData();
        formData.append("file", { uri, name: "audio.wav", type: "audio/wav" } as any);

        const res = await fetch("https://api.sarvam.ai/speech-to-text", {
          method: "POST",
          headers: {
            "api-subscription-key": "sk_wi1213h9_6Q5JLi1ADrmyM9g6e4i67JqI"
          },
          body: formData
        });
        const data = await res.json();

        if (data.transcript) {
          setQuery("");
          handleSend(data.transcript);
        } else {
          setQuery("");
          setMessages((prev) => [...prev, { sender: "ai", text: "Could not transcribe audio properly." }]);
        }
      }
    } catch (error) {
      console.error("Failed to stop recording", error);
      setQuery("");
    }
  };

  const handleVoiceListen = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const slideAnim = useRef(new Animated.Value(-400)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -400,
      duration: 200,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => onClose());
  };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)" }]} onPress={closeMenu} />
      <Animated.View
        style={[
          styles.sideDrawerCard,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <View style={styles.rowBetween}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={styles.aiBadgeIconCircle}>
              <Ionicons name="sparkles" size={18} color="#FF6B00" />
            </View>
            <View>
              <Text style={styles.modalTitle}>Sarvam AI Voice Assistant</Text>
              <Text style={styles.profileSubText}>Multilingual Voice Chat & STT/TTS</Text>
            </View>
          </View>
          <Pressable onPress={closeMenu} style={styles.closeIconButton}>
            <Ionicons name="close" size={22} color="#1C1C1E" />
          </Pressable>
        </View>

        <ScrollView style={{ maxHeight: 300, marginVertical: 14 }} keyboardShouldPersistTaps="handled">
          {messages.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.chatBubble,
                msg.sender === "user" ? styles.bubbleUser : styles.bubbleAi,
              ]}
            >
              <Ionicons
                name={msg.sender === "user" ? "person" : "sparkles"}
                size={14}
                color={msg.sender === "user" ? "#0F172A" : "#FF6B00"}
              />
              <Text style={msg.sender === "user" ? styles.chatTextUser : styles.chatTextAi}>
                {msg.text}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.quickVoiceChipsRow}>
          {["Plumbing Jobs Nearby", "Check Earnings", "Verify e-Shram"].map((chip) => (
            <Pressable key={chip} onPress={() => handleSend(chip)} style={styles.chipPill}>
              <Text style={styles.chipPillText}>{chip}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.chatInputRow}>
          <Pressable
            onPress={handleVoiceListen}
            style={[styles.micListenButton, isListening && styles.micListeningActive]}
          >
            <Ionicons name={isListening ? "mic" : "mic-outline"} size={22} color="#0F172A" />
          </Pressable>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={isListening ? "Listening in Hindi/English..." : "Ask AI or speak in regional language..."}
            placeholderTextColor="#64748B"
            style={styles.chatInputFlex}
            onSubmitEditing={() => handleSend()}
          />

          <Pressable onPress={() => handleSend()} style={styles.sendChatButton}>
            <Ionicons name="send" size={16} color="#0F172A" />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

// SETTINGS MODAL COMPONENT
function SettingsModal({
  userData,
  setUserData,
  activeRole,
  workerBadges,
  trustScore,
  onOpenVerification,
  onSwitchRole,
  onClose,
  onSignOut,
}: {
  userData: OnboardingData;
  setUserData: React.Dispatch<React.SetStateAction<OnboardingData | null>>;
  activeRole: Role;
  workerBadges: string[];
  trustScore: number;
  onOpenVerification: () => void;
  onSwitchRole: (role: Role) => void;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const [notifications, setNotifications] = useState(true);

  const slideAnim = useRef(new Animated.Value(-400)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -400,
      duration: 200,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => onClose());
  };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)" }]} onPress={closeMenu} />
      <Animated.View
        style={[
          styles.sideDrawerCard,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <View style={styles.rowBetween}>
          <Text style={styles.modalTitle}>App Settings</Text>
          <Pressable onPress={closeMenu} style={styles.closeIconButton}>
            <Ionicons name="close" size={22} color="#1C1C1E" />
          </Pressable>
        </View>

        <ScrollView style={{ maxHeight: 540 }} keyboardShouldPersistTaps="handled">
          {/* User Profile Card */}
          <View style={styles.settingsProfileCard}>
            <View style={styles.avatarCircleBig}>
              <Text style={styles.avatarBigText}>
                {userData.fullName ? userData.fullName.charAt(0).toUpperCase() : "U"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileNameText}>{userData.fullName || "User Name"}</Text>
              <Text style={styles.profileSubText}>@{userData.username || "username"}</Text>
              <Text style={styles.profileSubText}>📞 {userData.phone || "+91 9876543210"}</Text>
              <Text style={styles.profileSubText}>📍 {userData.city || "Bengaluru"}, {userData.state || "Karnataka"}</Text>
            </View>
          </View>

          {/* VERIFIED WORKER BADGES & TRUST SCORE CARD (MOVED TO SETTINGS) */}
          <View style={styles.settingsCardBox}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <View style={styles.verifiedHeaderBadgePill}>
                  <Ionicons name="ribbon" size={16} color="#E65100" />
                  <Text style={styles.verifiedHeaderBadgeText}>VERIFIED WORKER PROFILE</Text>
                </View>
                <Text style={styles.workerNameTitleText}>{userData.fullName || "Ramesh Kumar"}</Text>
              </View>

              <View style={styles.trustBadgeBox}>
                <Text style={styles.trustScoreNumberText}>{trustScore}</Text>
                <Text style={styles.trustScoreMaxText}>/100 Trust Score</Text>
              </View>
            </View>

            <View style={styles.badgesChipRow}>
              {workerBadges.map((badge) => (
                <View key={badge} style={styles.profileBadgePill}>
                  <Ionicons name="checkmark-circle" size={13} color="#16A34A" />
                  <Text style={styles.profileBadgeText}>{badge}</Text>
                </View>
              ))}
            </View>

            <Pressable
              onPress={() => {
                onClose();
                onOpenVerification();
              }}
              style={styles.reVerifyButton}
            >
              <Ionicons name="shield-checkmark-outline" size={15} color="#E65100" />
              <Text style={styles.reVerifyButtonText}>Upgrade / Verify More Skills</Text>
            </Pressable>
          </View>

          {/* Active Login Role Switcher */}
          <View style={styles.settingsCardBox}>
            <Text style={styles.settingsSectionTitle}>Active Login Mode / Role</Text>
            <Text style={styles.settingsSubText}>
              Switch what mode you want to log in as. Customer, Worker, and Company views remain completely isolated.
            </Text>

            <View style={styles.roleSwitchGrid}>
              <Pressable
                onPress={() => onSwitchRole("customer")}
                style={[styles.roleSwitchBtn, activeRole === "customer" && styles.roleSwitchBtnActive]}
              >
                <Ionicons name="search" size={18} color={activeRole === "customer" ? "#FFFFFF" : "#E65100"} />
                <Text style={[styles.roleSwitchText, activeRole === "customer" && styles.roleSwitchTextActive]}>
                  Customer
                </Text>
              </Pressable>

              <Pressable
                onPress={() => onSwitchRole("worker")}
                style={[styles.roleSwitchBtn, activeRole === "worker" && styles.roleSwitchBtnActive]}
              >
                <Ionicons name="hammer" size={18} color={activeRole === "worker" ? "#FFFFFF" : "#E65100"} />
                <Text style={[styles.roleSwitchText, activeRole === "worker" && styles.roleSwitchTextActive]}>
                  Worker
                </Text>
              </Pressable>

              <Pressable
                onPress={() => onSwitchRole("company")}
                style={[styles.roleSwitchBtn, activeRole === "company" && styles.roleSwitchBtnActive]}
              >
                <Ionicons name="business" size={18} color={activeRole === "company" ? "#FFFFFF" : "#E65100"} />
                <Text style={[styles.roleSwitchText, activeRole === "company" && styles.roleSwitchTextActive]}>
                  Company
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Notifications Setting */}
          <View style={styles.settingsCardBox}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.settingsSectionTitle}>Push Notifications</Text>
                <Text style={styles.settingsSubText}>Receive order updates and nearby job alerts</Text>
              </View>
              <Pressable onPress={() => setNotifications(!notifications)} style={styles.toggleSwitchBtn}>
                <Ionicons
                  name={notifications ? "toggle" : "toggle-outline"}
                  size={32}
                  color={notifications ? "#E65100" : "#667085"}
                />
              </Pressable>
            </View>
          </View>

          {/* Cooperative Reserve Structure */}
          <View style={styles.settingsCardBox}>
            <Text style={styles.settingsSectionTitle}>Cooperative Reserve Structure</Text>
            <View style={styles.reserveRow}>
              <View style={styles.reserveItem}>
                <Text style={styles.reserveVal}>90%</Text>
                <Text style={styles.reserveLbl}>Worker Payout</Text>
              </View>
              <View style={styles.reserveItem}>
                <Text style={styles.reserveVal}>7%</Text>
                <Text style={styles.reserveLbl}>Co-op Reserve</Text>
              </View>
              <View style={styles.reserveItem}>
                <Text style={styles.reserveVal}>3%</Text>
                <Text style={styles.reserveLbl}>Mutual Aid</Text>
              </View>
            </View>
          </View>

          <Pressable onPress={onSignOut} style={styles.signOutButton}>
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <Text style={styles.signOutText}>Sign Out / Change Account</Text>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </View>
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

// WHATSAPP OTP VERIFICATION MODAL
function WhatsAppOtpModal({
  phone,
  otpCode,
  onVerifySuccess,
  onClose,
  onResendOtp,
}: {
  phone: string;
  otpCode: string;
  onVerifySuccess: () => void;
  onClose: () => void;
  onResendOtp: () => void;
}) {
  const [inputOtp, setInputOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verified, setVerified] = useState(false);

  const handleVerify = () => {
    if (inputOtp.trim() === otpCode || inputOtp.trim() === "7429") {
      setOtpError("");
      setVerified(true);
      setTimeout(() => {
        onVerifySuccess();
      }, 800);
    } else {
      setOtpError(`Invalid OTP code "${inputOtp}". Use ${otpCode} or tap 'Auto-Fill'.`);
    }
  };

  return (
    <View style={styles.modalBackdrop}>
      <View style={styles.whatsappOtpModalCard}>
        {/* WhatsApp Notification Banner Simulation */}
        <View style={styles.whatsappNotificationBanner}>
          <Ionicons name="logo-whatsapp" size={20} color="#128C7E" />
          <View style={{ flex: 1 }}>
            <Text style={styles.whatsappNotifTitle}>WhatsApp Message from Shram Sangam</Text>
            <Text style={styles.whatsappNotifBody}>
              Your verification OTP is <Text style={{ fontWeight: "900", color: "#128C7E" }}>{otpCode}</Text>. Do not share with anyone.
            </Text>
          </View>
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.modalTitle}>WhatsApp OTP Verification</Text>
          <Pressable onPress={onClose} style={styles.closeIconButton}>
            <Ionicons name="close" size={22} color="#1C1C1E" />
          </Pressable>
        </View>

        <Text style={styles.modalSub}>
          Enter the 4-digit code sent to <Text style={{ fontWeight: "800", color: "#1C1C1E" }}>+91 {phone}</Text> via WhatsApp.
        </Text>

        {verified ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
            <Text style={styles.successBannerText}>✓ WhatsApp OTP Verified Successfully!</Text>
          </View>
        ) : (
          <View>
            <View style={styles.otpPinRow}>
              <TextInput
                value={inputOtp}
                onChangeText={setInputOtp}
                placeholder="7 4 2 9"
                keyboardType="phone-pad"
                maxLength={4}
                style={styles.otpPinInput}
              />
            </View>

            {/* Auto-fill Hint Button */}
            <Pressable
              onPress={() => setInputOtp(otpCode)}
              style={styles.autoFillHintButton}
            >
              <Ionicons name="sparkles-outline" size={15} color="#128C7E" />
              <Text style={styles.autoFillHintText}>Auto-Fill OTP ({otpCode})</Text>
            </Pressable>

            {otpError ? (
              <View style={styles.formError}>
                <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
                <Text style={styles.formErrorText}>{otpError}</Text>
              </View>
            ) : null}

            <View style={styles.modalActionsRow}>
              <Pressable onPress={onResendOtp} style={styles.modalCancelButton}>
                <Text style={styles.modalCancelText}>Resend OTP</Text>
              </Pressable>

              <Pressable onPress={handleVerify} style={styles.btnPrimarySaffronFlex}>
                <Text style={styles.btnPrimarySaffronText}>VERIFY & PROCEED</Text>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function OnboardingFlow({
  onComplete,
}: {
  onComplete: (data: OnboardingData) => void;
}) {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState<"gateway" | "customer" | "worker">("gateway");
  const [selectedRoleFork, setSelectedRoleFork] = useState<Role>("worker");
  const [selectedLang, setSelectedLang] = useState("EN");

  const [mobileNumber, setMobileNumber] = useState("9876543210");
  const [generatedOtp, setGeneratedOtp] = useState("7429");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [fullName, setFullName] = useState("Anita Sharma");
  const [address, setServiceAddress] = useState("Flat 402, Green Glen Apartments, HSR Layout Sector 2, Bengaluru");
  const [petOnPremises, setPetOnPremises] = useState(true);
  const [hasElevator, setHasElevator] = useState(true);
  const [gatePermission, setGatePermission] = useState(false);

  // Worker Reg State
  const [selectedTrades, setSelectedTrades] = useState<string[]>(["Plumbing", "Electrical"]);
  const [experience, setExperience] = useState("3-5+ Yrs");
  const [hasTools, setHasTools] = useState(true);
  const [hasVehicle, setHasVehicle] = useState(true);
  const [digiVerified, setDigiVerified] = useState(true);
  const [upiId, setUpiId] = useState("ramesh.kumar@okhdfcbank");
  const [instantPayout, setInstantPayout] = useState(true);

  const handleFinishCustomer = () => {
    onComplete({
      username: mobileNumber,
      password: "••••••••",
      confirmPassword: "••••••••",
      fullName: fullName || "Anita Sharma",
      phone: mobileNumber,
      gender: "Female",
      address,
      city: "Bengaluru",
      state: "Karnataka",
      role: "customer",
      category: "Plumbing",
      selectedServices: ["Plumbing"],
      organization: "Home",
    });
  };

  const handleFinishWorker = () => {
    onComplete({
      username: mobileNumber,
      password: "••••••••",
      confirmPassword: "••••••••",
      fullName: "Ramesh Kumar",
      phone: mobileNumber,
      gender: "Male",
      address: "HSR Layout Sector 2",
      city: "Bengaluru",
      state: "Karnataka",
      role: "worker",
      category: selectedTrades[0] || "Plumbing",
      selectedServices: selectedTrades,
      organization: "Shram Sangam Cooperative",
    });
  };

  const handleTriggerWhatsAppOtp = () => {
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(newOtp);
    setShowOtpModal(true);
  };

  const handleOtpSuccess = () => {
    setShowOtpModal(false);
    if (selectedRoleFork === "company") {
      onComplete({
        username: mobileNumber,
        password: "••••••••",
        confirmPassword: "••••••••",
        fullName: "Enterprise Projects Ltd",
        phone: mobileNumber,
        gender: "Prefer not to say",
        address: "Commercial Tech Hub",
        city: "Bengaluru",
        state: "Karnataka",
        role: "company",
        category: "Construction",
        selectedServices: ["Construction"],
        organization: "Shram Sangam Cooperative Partner",
      });
    } else if (selectedRoleFork === "customer") {
      setStep("customer");
    } else {
      setStep("worker");
    }
  };

  return (
    <SafeAreaView style={styles.onboardingSafe}>
      <StatusBar style="light" backgroundColor="#000000" />
      <View style={styles.topNotchBlackBar} />

      <ScrollView contentContainerStyle={styles.onboardingContent} keyboardShouldPersistTaps="handled">
        {/* STEP 1: GATEWAY & VERNACULAR LANGUAGE BAR */}
        {step === "gateway" && (
          <View style={styles.screenContainerBox}>
            {/* Vernacular Language Bar */}
            <View style={styles.langPillBarRow}>
              {[
                { code: "EN", label: "English 🔊" },
                { code: "HI", label: "हिंदी 🔊" },
                { code: "TE", label: "తెలుగు 🔊" },
                { code: "KA", label: "ಕನ್ನಡ 🔊" },
              ].map((lang) => (
                <Pressable
                  key={lang.code}
                  onPress={() => {
                    setSelectedLang(lang.code);
                    i18n.changeLanguage(lang.code);
                  }}
                  style={[styles.langPillItem, selectedLang === lang.code && styles.langPillItemActive]}
                >
                  <Text style={[styles.langPillText, selectedLang === lang.code && styles.langPillTextActive]}>
                    {lang.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Header Brand */}
            <View style={{ alignItems: "center", marginVertical: 16 }}>
              <Image source={logoTransparent} style={{ width: 100, height: 100 }} resizeMode="contain" />
              <Text style={styles.brandTitleText}>SHRAM SANGAM</Text>
              <Text style={styles.brandSubTaglineText}>{t('greeting')}</Text>
            </View>

            {/* Mobile Number Entry Box */}
            <View style={styles.contentCard}>
              <Text style={styles.fieldLabel}>Enter Mobile Number</Text>
              <View style={styles.phoneInputBoxShell}>
                <Text style={styles.countryCodeText}>🇮🇳 +91  |</Text>
                <TextInput
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  placeholder="9 8 7 6 5   4 3 2 1 0"
                  keyboardType="phone-pad"
                  style={styles.phoneInputBold}
                />
              </View>

              {/* Saffron CTA Button */}
              <Pressable
                onPress={handleTriggerWhatsAppOtp}
                style={styles.btnPrimarySaffron}
              >
                <Text style={styles.btnPrimarySaffronText}>GET OTP VIA SMS / WHATSAPP</Text>
              </Pressable>

              {/* WhatsApp Fallback Button */}
              <Pressable
                onPress={handleTriggerWhatsAppOtp}
                style={styles.btnWhatsAppFallback}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#128C7E" />
                <Text style={styles.btnWhatsAppText}>Continue with WhatsApp Verification</Text>
              </Pressable>

              {/* Visual Role Fork Selector */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>NEW HERE? CHOOSE ROLE</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.roleForkGrid}>
                <Pressable
                  onPress={() => setSelectedRoleFork("customer")}
                  style={[styles.roleForkCard, selectedRoleFork === "customer" && styles.roleForkCardActive]}
                >
                  <Text style={{ fontSize: 24 }}>🏠</Text>
                  <Text style={styles.roleForkTitle}>{t('customer_mode')}</Text>
                  <Text style={styles.roleForkSub}>{t('customer_sub')}</Text>
                </Pressable>

                <Pressable
                  onPress={() => setSelectedRoleFork("worker")}
                  style={[styles.roleForkCard, selectedRoleFork === "worker" && styles.roleForkCardActive]}
                >
                  <Text style={{ fontSize: 24 }}>🛠️</Text>
                  <Text style={styles.roleForkTitle}>{t('worker_mode')}</Text>
                  <Text style={styles.roleForkSub}>{t('worker_sub')}</Text>
                </Pressable>

                <Pressable
                  onPress={() => setSelectedRoleFork("company")}
                  style={[styles.roleForkCard, selectedRoleFork === "company" && styles.roleForkCardActive]}
                >
                  <Text style={{ fontSize: 24 }}>🏢</Text>
                  <Text style={styles.roleForkTitle}>{t('company_mode')}</Text>
                  <Text style={styles.roleForkSub}>{t('company_sub')}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* WhatsApp OTP Modal Trigger */}
        {showOtpModal && (
          <WhatsAppOtpModal
            phone={mobileNumber}
            otpCode={generatedOtp}
            onVerifySuccess={handleOtpSuccess}
            onClose={() => setShowOtpModal(false)}
            onResendOtp={handleTriggerWhatsAppOtp}
          />
        )}

        {/* STEP 2A: CUSTOMER FAST-TRACK REGISTRATION */}
        {step === "customer" && (
          <View style={styles.screenContainerBox}>
            <View style={styles.rowBetween}>
              <Pressable onPress={() => setStep("gateway")} style={styles.backButton}>
                <Ionicons name="arrow-back" size={16} color="#1C1C1E" />
                <Text style={styles.backButtonText}>Back</Text>
              </Pressable>
              <Text style={styles.stepTitleText}>Sign Up: Customer</Text>
            </View>

            <View style={[styles.contentCard, { marginTop: 16 }]}>
              <Field
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. Anita Sharma"
                icon="person-outline"
              />

              <Field
                label="Service Address"
                value={address}
                onChangeText={setServiceAddress}
                placeholder="📍 HSR Layout Sector 2, Bengaluru"
                icon="location-outline"
              />

              <Text style={styles.fieldLabel}>Home Context & Accessibility</Text>

              <Pressable onPress={() => setPetOnPremises(!petOnPremises)} style={styles.checkboxRow}>
                <Ionicons name={petOnPremises ? "checkbox" : "square-outline"} size={20} color={petOnPremises ? "#E65100" : "#667085"} />
                <Text style={styles.checkboxLabelText}>Pet on premises (Dog/Cat)</Text>
              </Pressable>

              <Pressable onPress={() => setHasElevator(!hasElevator)} style={styles.checkboxRow}>
                <Ionicons name={hasElevator ? "checkbox" : "square-outline"} size={20} color={hasElevator ? "#E65100" : "#667085"} />
                <Text style={styles.checkboxLabelText}>Building has working lift/elevator</Text>
              </Pressable>

              <Pressable onPress={() => setGatePermission(!gatePermission)} style={styles.checkboxRow}>
                <Ionicons name={gatePermission ? "checkbox" : "square-outline"} size={20} color={gatePermission ? "#E65100" : "#667085"} />
                <Text style={styles.checkboxLabelText}>Security permission required at main gate</Text>
              </Pressable>

              <Pressable onPress={handleFinishCustomer} style={styles.continueButton}>
                <Text style={styles.continueButtonText}>COMPLETE SIGNUP & BOOK SERVICE</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        )}

        {/* STEP 2B: GIG WORKER REGISTRATION & VERIFICATION */}
        {step === "worker" && (
          <View style={styles.screenContainerBox}>
            <View style={styles.rowBetween}>
              <Pressable onPress={() => setStep("gateway")} style={styles.backButton}>
                <Ionicons name="arrow-back" size={16} color="#1C1C1E" />
                <Text style={styles.backButtonText}>Back</Text>
              </Pressable>
              <Text style={styles.stepTitleText}>Partner Onboarding (Step 1 of 3)</Text>
            </View>

            <View style={[styles.contentCard, { marginTop: 16 }]}>
              <Text style={styles.fieldLabel}>What is your primary trade?</Text>

              <View style={styles.choiceGrid}>
                {["Plumbing", "Electrical", "Carpentry", "Cleaning", "Painting"].map((trade) => {
                  const isSel = selectedTrades.includes(trade);
                  return (
                    <Pressable
                      key={trade}
                      onPress={() => {
                        setSelectedTrades((prev) =>
                          prev.includes(trade) ? prev.filter((t) => t !== trade) : [...prev, trade],
                        );
                      }}
                      style={[styles.tradePillCard, isSel && styles.tradePillCardActive]}
                    >
                      <Text style={[styles.tradePillText, isSel && styles.tradePillTextActive]}>
                        {isSel ? `✓ ${trade}` : trade}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Experience Level</Text>
              <View style={styles.choiceGrid}>
                {["Under 1 Yr", "1-3 Yrs", "3-5+ Yrs"].map((exp) => (
                  <Choice key={exp} label={exp} active={experience === exp} onPress={() => setExperience(exp)} />
                ))}
              </View>

              <Text style={styles.fieldLabel}>Tools & Transport</Text>
              <Pressable onPress={() => setHasTools(!hasTools)} style={styles.checkboxRow}>
                <Ionicons name={hasTools ? "checkbox" : "square-outline"} size={20} color={hasTools ? "#E65100" : "#667085"} />
                <Text style={styles.checkboxLabelText}>Standard tool bag owned</Text>
              </Pressable>

              <Pressable onPress={() => setHasVehicle(!hasVehicle)} style={styles.checkboxRow}>
                <Ionicons name={hasVehicle ? "checkbox" : "square-outline"} size={20} color={hasVehicle ? "#E65100" : "#667085"} />
                <Text style={styles.checkboxLabelText}>Two-Wheeler / Bike available for travel</Text>
              </Pressable>

              {/* DigiLocker Identity Verification Badge */}
              <Text style={styles.fieldLabel}>Quick Identity Verification</Text>
              <View style={styles.digiLockerBox}>
                <Ionicons name="folder-open" size={20} color="#0284C7" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.digiTitleText}>Auto-Fetched via DigiLocker (Aadhaar)</Text>
                  <Text style={styles.digiSubText}>✓ Verified: Ramesh Kumar (UID: XXXX-8910)</Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              </View>

              {/* Payout Method */}
              <Field
                label="Payout Method (UPI ID)"
                value={upiId}
                onChangeText={setUpiId}
                placeholder="e.g. ramesh.kumar@okhdfcbank"
                icon="cash-outline"
              />

              <Pressable onPress={() => setInstantPayout(!instantPayout)} style={styles.checkboxRow}>
                <Ionicons name={instantPayout ? "checkbox" : "square-outline"} size={20} color={instantPayout ? "#E65100" : "#667085"} />
                <Text style={styles.checkboxLabelText}>Enable Daily Instant Payout to this UPI</Text>
              </Pressable>

              <Pressable onPress={handleFinishWorker} style={styles.continueButton}>
                <Text style={styles.continueButtonText}>ACTIVATE ACCOUNT & GO ONLINE</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        )}
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
  icon,
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
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isSecure = secureTextEntry && !showPassword;

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.fieldInputShell,
          isFocused && styles.fieldInputShellFocused,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={isFocused ? "#FF6B00" : "#94A3B8"}
            style={styles.fieldIconLeft}
          />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#64748B"
          secureTextEntry={isSecure}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          multiline={multiline}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.fieldInput,
            icon && styles.fieldInputWithIcon,
            secureTextEntry && styles.fieldInputWithEye,
            multiline && styles.fieldInputMultiline,
            disabled && styles.fieldInputDisabled,
          ]}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            style={styles.fieldEyeButton}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#94A3B8"
            />
          </Pressable>
        )}
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
            <Ionicons name={service.icon} size={24} color="#2563EB" />
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
          <Split value="90%" label="worker" color="#2563EB" />
          <Split value="7%" label="reserve" color="#C85A13" />
          <Split value="3%" label="mutual aid" color="#c95062" />
        </View>
      </View>
    </View>
  );
}

import { Colors, Spacing, Shadows } from "./theme";

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9F6F0" },
  content: { padding: 16, paddingBottom: 40 },

  topNotchBlackBar: {
    height: 38,
    backgroundColor: "#000000",
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
  },

  // New Layout & Section Styles
  sectionContainer: {
    paddingVertical: 10,
  },
  heroTitleText: {
    color: "#1C1C1E",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 6,
  },
  heroSubText: {
    color: "#667085",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  appMainHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#0284C7",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.15)",
  },
  appHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerLogoSmall: {
    width: 36,
    height: 36,
  },
  headerTitleText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  roleBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotCustomer: { backgroundColor: "#38BDF8" },
  dotWorker: { backgroundColor: "#34D399" },
  dotCompany: { backgroundColor: "#FF6B00" },
  roleBadgeText: {
    color: "#FF6B00",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  headerCityText: {
    color: "#CBD5E1",
    fontSize: 10,
    fontWeight: "600",
  },
  settingsHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  mainScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    backgroundColor: "#F9F6F0",
  },

  // Customer Tabs
  customerTabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  customerTabPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EBE5DF",
    borderRadius: 16,
    paddingVertical: 10,
  },
  customerTabPillActive: {
    backgroundColor: "#E65100",
    borderColor: "#E65100",
  },
  customerTabText: {
    color: "#667085",
    fontSize: 12,
    fontWeight: "700",
  },
  customerTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  // Cards
  contentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EBE5DF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 20,
  },
  cardHeaderTitle: {
    color: "#1C1C1E",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  cardSubText: {
    color: "#667085",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  successBannerText: {
    color: "#6EE7B7",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },

  // Photo Attachment Button
  photoUploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#334155",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(148, 163, 184, 0.3)",
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 18,
  },
  photoUploadButtonActive: {
    backgroundColor: "rgba(255, 107, 0, 0.12)",
    borderColor: "#FF6B00",
    borderStyle: "solid",
  },
  photoUploadText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
  },
  photoUploadTextActive: {
    color: "#FF6B00",
    fontWeight: "800",
  },

  // Worker List Items
  workerListItem: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EBE5DF",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  workerAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(230, 81, 0, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  workerDetails: {
    flex: 1,
  },
  workerNameText: {
    color: "#1C1C1E",
    fontSize: 15,
    fontWeight: "800",
  },
  workerTradeText: {
    color: "#667085",
    fontSize: 12,
    marginTop: 2,
  },
  workerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },
  workerMetaText: {
    color: "#667085",
    fontSize: 12,
  },
  workerPriceText: {
    color: "#E65100",
    fontSize: 13,
    fontWeight: "800",
  },
  statusBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeOnline: { backgroundColor: "rgba(46, 125, 50, 0.12)" },
  badgeOffline: { backgroundColor: "rgba(102, 112, 133, 0.12)" },
  smallStatusDot: { width: 6, height: 6, borderRadius: 3 },
  dotGreen: { backgroundColor: "#2E7D32" },
  dotGrey: { backgroundColor: "#667085" },
  statusBadgeText: { fontSize: 11, fontWeight: "700" },
  textGreen: { color: "#2E7D32" },
  textGrey: { color: "#667085" },

  // Order List Items
  orderCardItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#EBE5DF",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryBadge: {
    backgroundColor: "rgba(255, 107, 0, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: "#FF6B00",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  orderStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusCompleted: { backgroundColor: "rgba(52, 211, 153, 0.15)" },
  statusAssigned: { backgroundColor: "rgba(56, 189, 248, 0.15)" },
  statusOpen: { backgroundColor: "rgba(251, 191, 36, 0.15)" },
  orderStatusText: { color: "#1C1C1E", fontSize: 11, fontWeight: "700" },
  orderTitleText: { color: "#1C1C1E", fontSize: 16, fontWeight: "800", marginTop: 8 },
  orderDescText: { color: "#667085", fontSize: 13, lineHeight: 18, marginTop: 4 },
  photoAttachedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  photoAttachedText: { color: "#38BDF8", fontSize: 11, fontWeight: "700" },
  orderMetaFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(148, 163, 184, 0.15)",
  },
  orderPriceText: { color: "#FF6B00", fontSize: 14, fontWeight: "900" },
  orderLocalityText: { color: "#94A3B8", fontSize: 12 },

  // Rating & Review
  ratingSection: { marginTop: 10 },
  ratingDisplayRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  starsText: { color: "#FF6B00", fontSize: 16, letterSpacing: 2 },
  ratingCommentText: { color: "#CBD5E1", fontSize: 12, fontStyle: "italic" },
  rateServiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255, 107, 0, 0.15)",
    borderWidth: 1,
    borderColor: "#FF6B00",
    borderRadius: 14,
    paddingVertical: 10,
    marginTop: 6,
  },
  rateServiceButtonText: { color: "#FF6B00", fontSize: 13, fontWeight: "800" },

  // Worker Feed Cards
  jobFeedCard: {
    backgroundColor: "#334155",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
  },
  distanceBadgeText: { color: "#94A3B8", fontSize: 12 },
  jobFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(148, 163, 184, 0.15)",
  },
  mutedText: { color: "#94A3B8", fontSize: 11 },
  jobPriceText: { color: "#34D399", fontSize: 16, fontWeight: "900" },
  acceptJobButton: {
    backgroundColor: "#FF6B00",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  acceptJobButtonText: { color: "#0F172A", fontSize: 13, fontWeight: "900" },
  activeJobItem: {
    backgroundColor: "#334155",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  completeJobButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  completeJobButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  completedBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  completedBadgeText: { color: "#34D399", fontSize: 12, fontWeight: "700" },

  // Stats Grid
  statGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
  },
  statValue: { color: "#F8FAFC", fontSize: 16, fontWeight: "900", marginTop: 4 },
  statLabel: { color: "#94A3B8", fontSize: 11, marginTop: 2 },

  // Company Specialist Hire
  hireSpecialistButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FF6B00",
    borderRadius: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  hireSpecialistText: { color: "#0F172A", fontSize: 12, fontWeight: "800" },

  // Group Project Cards
  projectCardItem: {
    backgroundColor: "#334155",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
  },
  teamBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255, 107, 0, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  teamBadgeText: { color: "#FF6B00", fontSize: 11, fontWeight: "800" },
  projectBudgetText: { color: "#34D399", fontSize: 15, fontWeight: "900" },
  projectFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(148, 163, 184, 0.15)",
  },

  // Modal Backdrop
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 23, 0.82)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    paddingHorizontal: 16,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#0F172A",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.18)",
  },
  modalTitle: { color: "#F8FAFC", fontSize: 20, fontWeight: "900" },
  modalSub: { color: "#94A3B8", fontSize: 13, marginTop: 4, marginBottom: 18 },
  starsPickerRow: { flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 20 },
  modalActionsRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  modalCancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#334155",
  },
  modalCancelText: { color: "#CBD5E1", fontSize: 14, fontWeight: "700" },

  // Settings Modal
  settingsModalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 22,
    borderWidth: 1.5,
    borderColor: "#EBE5DF",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  sideDrawerCard: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "85%", // Covers most of the screen
    backgroundColor: "#FFF9ED", // Milky yellow white
    paddingTop: 50,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  closeIconButton: { padding: 4 },
  settingsProfileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#F8F6F0",
    borderRadius: 20,
    padding: 16,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: "#EBE5DF",
  },
  avatarCircleBig: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E65100",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBigText: { color: "#FFFFFF", fontSize: 22, fontWeight: "900" },
  profileNameText: { color: "#1C1C1E", fontSize: 17, fontWeight: "900" },
  profileSubText: { color: "#4B5563", fontSize: 12, marginTop: 2 },
  settingsCardBox: {
    backgroundColor: "#F8F6F0",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#EBE5DF",
  },
  settingsSectionTitle: { color: "#1C1C1E", fontSize: 15, fontWeight: "800" },
  settingsSubText: { color: "#667085", fontSize: 12, lineHeight: 17, marginTop: 4, marginBottom: 12 },
  roleSwitchGrid: { flexDirection: "row", gap: 8 },
  roleSwitchBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EBE5DF",
  },
  roleSwitchBtnActive: { backgroundColor: "#E65100", borderColor: "#E65100" },
  roleSwitchText: { color: "#1C1C1E", fontSize: 12, fontWeight: "700" },
  roleSwitchTextActive: { color: "#FFFFFF", fontWeight: "900" },
  toggleSwitchBtn: { padding: 2 },
  reserveRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  reserveItem: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 12, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#EBE5DF" },
  reserveVal: { color: "#0284C7", fontSize: 16, fontWeight: "900" },
  reserveLbl: { color: "#667085", fontSize: 10, marginTop: 2 },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: 18,
    paddingVertical: 14,
    marginTop: 10,
    marginBottom: 10,
  },
  signOutText: { color: "#FCA5A5", fontSize: 14, fontWeight: "800" },
  btnOnline: { backgroundColor: "rgba(52, 211, 153, 0.15)", borderColor: "#34D399" },
  btnOffline: { backgroundColor: "rgba(148, 163, 184, 0.15)", borderColor: "#94A3B8" },
  onlineToggleButton: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  onlineToggleText: { color: "#F8FAFC", fontSize: 12, fontWeight: "800" },
  emptyText: { color: "#94A3B8", fontSize: 13, fontStyle: "italic", marginVertical: 10 },
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
    color: "#2563EB",
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
  modeButtonActive: { backgroundColor: "#2563EB" },
  modeButtonText: { color: "#46556B", fontSize: 11, fontWeight: "700" },
  modeButtonTextActive: { color: "#fff" },
  modeLabel: {
    color: "#2563EB",
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
    backgroundColor: "#2563EB",
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
  successText: { color: "#2563EB", fontSize: 13, flex: 1 },
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
    color: "#2563EB",
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
  voteYes: { backgroundColor: "#2563EB" },
  voteNo: { backgroundColor: "#B83B4B" },
  voteText: { color: "#2563EB", fontWeight: "800", fontSize: 12 },
  voteTextActive: { color: "#fff" },
  onboardingSafe: {
    flex: 1,
    backgroundColor: "#F9F6F0",
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
    backgroundColor: "#2563EB",
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
  bgOrb1: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255, 107, 0, 0.15)",
  },
  bgOrb2: {
    position: "absolute",
    bottom: -100,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(22, 75, 122, 0.25)",
  },
  modernHeader: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 107, 0, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 0, 0.3)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  brandBadgeText: {
    color: "#FF6B00",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  glassMatteCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 22,
    borderWidth: 1.5,
    borderColor: "#EBE5DF",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    marginBottom: 24,
  },
  glassCardGlow: {
    position: "absolute",
    top: 0,
    left: 30,
    right: 30,
    height: 2,
    backgroundColor: "rgba(230, 81, 0, 0.2)",
    borderRadius: 2,
  },
  stepTrack: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 22,
  },
  stepDot: {
    height: 5,
    flex: 1,
    borderRadius: 5,
    backgroundColor: "#EBE5DF",
  },
  stepDotActive: {
    backgroundColor: "#FF6B00",
    shadowColor: "#FF6B00",
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  field: {
    marginBottom: 18,
  },
  fieldLabel: {
    color: "#1C1C1E",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  fieldInputShell: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#EBE5DF",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  fieldInputShellFocused: {
    borderColor: "#FF6B00",
    backgroundColor: "#FFFFFF",
  },
  fieldIconLeft: {
    paddingLeft: 16,
  },
  fieldInput: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 16,
    color: "#1C1C1E",
    fontSize: 15,
    fontWeight: "500",
  },
  fieldInputWithIcon: {
    paddingLeft: 10,
  },
  fieldInputWithEye: {
    paddingRight: 10,
  },
  fieldEyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fieldInputMultiline: {
    minHeight: 88,
    paddingTop: 14,
    textAlignVertical: "top",
  },
  fieldInputDisabled: {
    opacity: 0.5,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(148, 163, 184, 0.2)",
  },
  dividerText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#334155",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    borderRadius: 16,
    paddingVertical: 13,
  },
  socialText: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "700",
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
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.2)",
    borderTopColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 18,
    backgroundColor: "#334155",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  regionSelectText: { color: "#F8FAFC", fontSize: 15, flex: 1, paddingRight: 10 },
  regionPlaceholder: {
    color: "#64748B",
    fontSize: 14,
    flex: 1,
    paddingRight: 10,
  },
  regionList: {
    maxHeight: 240,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.2)",
    borderRadius: 18,
    backgroundColor: "#334155",
    overflow: "hidden",
    marginBottom: 18,
  },
  regionOption: {
    minHeight: 45,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.15)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  regionOptionActive: { backgroundColor: "rgba(255, 107, 0, 0.15)" },
  regionOptionText: {
    color: "#CBD5E1",
    fontSize: 13,
    flex: 1,
    paddingRight: 8,
  },
  regionOptionTextActive: { color: "#FF6B00", fontWeight: "800" },
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
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.25)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#334155",
  },
  choiceActive: { backgroundColor: "#FF6B00", borderColor: "#FF6B00" },
  choiceText: { color: "#E2E8F0", fontSize: 12, fontWeight: "700" },
  choiceTextActive: { color: "#0F172A" },
  roleList: { gap: 12 },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#334155",
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.2)",
    borderTopColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  roleCardActive: {
    backgroundColor: "rgba(255, 107, 0, 0.12)",
    borderColor: "#FF6B00",
    shadowColor: "#FF6B00",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255, 107, 0, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  roleIconActive: { backgroundColor: "#FF6B00" },
  roleCopy: { flex: 1 },
  roleTitle: { color: "#F8FAFC", fontSize: 15, fontWeight: "800" },
  roleTitleActive: { color: "#FFF" },
  roleDetail: { color: "#94A3B8", fontSize: 12, lineHeight: 17, marginTop: 3 },
  roleDetailActive: { color: "#CBD5E1" },
  formError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: 14,
    padding: 12,
    marginTop: 18,
  },
  formErrorText: { color: "#FCA5A5", fontSize: 12, lineHeight: 17, flex: 1 },
  onboardingActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#334155",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backButtonText: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "700",
  },
  continueButton: {
    backgroundColor: "#FF6B00",
    borderRadius: 24,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FF8533",
    borderTopColor: "rgba(255, 255, 255, 0.5)",
    shadowColor: "#FF6B00",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    marginTop: 18,
  },
  continueButtonText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
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
  secondaryButtonText: { color: "#2563EB", fontSize: 12, fontWeight: "800" },
  screen2Container: {
    paddingTop: 28,
    alignItems: "center",
  },
  heroLogoFrame: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  heroLogoImage: {
    width: 190,
    height: 190,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 107, 0, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 0, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
  },
  heroBadgeText: {
    color: "#FF6B00",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  heroHeading: {
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  heroSubheading: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  skipText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "700",
  },
  nextPillButton: {
    backgroundColor: "#FF6B00",
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#FF6B00",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  nextPillText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  screen3Container: {
    paddingTop: 28,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderTopColor: "rgba(255, 255, 255, 0.28)",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  featureIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  featureCopy: {
    flex: 1,
  },
  featureTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  featureDetail: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 18,
  },
  screen4Container: {
    width: "100%",
    paddingTop: 28,
    alignItems: "center",
  },
  minimalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  topIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 153, 51, 0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 153, 51, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  topTaglineText: {
    color: "rgba(255, 255, 255, 0.92)",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  taglineUnderline: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#FF6B00",
    marginTop: 8,
  },
  splashBrandWordmark: {
    color: "#0284C7",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 12,
  },
  splashBrandTagline: {
    color: "#667085",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  segmentedContainer: {
    width: "100%",
    flexDirection: "row",
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: 20,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
  },
  segmentedTab: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentedTabActive: {
    backgroundColor: "#FF6B00",
    shadowColor: "#FF6B00",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  segmentedTabText: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "700",
  },
  segmentedTabTextActive: {
    color: "#0F172A",
    fontWeight: "900",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  dot: {
    width: 22,
    height: 4,
    borderRadius: 2,
  },
  bottomTricolorRibbonWave: {
    width: "120%",
    height: 18,
    marginTop: 10,
    transform: [{ rotate: "-2deg" }],
  },
  ribbonSaffronLine: {
    height: 5,
    backgroundColor: "#FF9933",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  ribbonWhiteLine: {
    height: 5,
    backgroundColor: "#FFFFFF",
  },
  ribbonGreenLine: {
    height: 5,
    backgroundColor: "#138808",
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  splashContainerWhite: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  splashCenterContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  transparentLogoImage: {
    width: 230,
    height: 230,
  },
  navyGlowAccent: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#2563EB",
    shadowColor: "#002147",
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 20,
  },
  particle: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(22, 75, 122, 0.25)",
  },
  ribbonContainer: {
    position: "absolute",
    bottom: 60,
    left: -20,
    right: -20,
    alignItems: "center",
  },
  ribbonSaffron: {
    width: "120%",
    height: 12,
    backgroundColor: "#FF9933",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  ribbonWhite: {
    width: "120%",
    height: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  ribbonNavyBorderTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(22, 75, 122, 0.2)",
  },
  ribbonNavyBorderBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(22, 75, 122, 0.2)",
  },
  ribbonGreen: {
    width: "120%",
    height: 12,
    backgroundColor: "#138808",
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  chakraFrame: {
    position: "absolute",
    zIndex: 10,
    shadowColor: "#000080",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  // Heatmap & Safety Dock
  surgeTagPill: {
    backgroundColor: "rgba(230, 81, 0, 0.12)",
    borderWidth: 1,
    borderColor: "#E65100",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  surgeTagText: { color: "#E65100", fontSize: 11, fontWeight: "900" },
  heatmapBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EBE5DF",
    marginTop: 8,
  },
  heatmapTitleText: { color: "#1C1C1E", fontSize: 14, fontWeight: "800" },
  heatmapDetailText: { color: "#4B5563", fontSize: 11, marginTop: 2 },
  navigateZoneButton: {
    backgroundColor: "#E65100",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  navigateZoneText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  safetyDockCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "rgba(211, 47, 47, 0.3)",
  },
  safetyDockTitle: { color: "#1C1C1E", fontSize: 14, fontWeight: "800", marginBottom: 10 },
  safetyDockRow: { flexDirection: "row", gap: 8 },
  sosButton: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#D32F2F",
    borderRadius: 14,
    paddingVertical: 10,
  },
  sosButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  safetyHelpButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#EBE5DF",
    borderRadius: 14,
    paddingVertical: 10,
  },
  safetyHelpText: { color: "#1C1C1E", fontSize: 11, fontWeight: "700" },
  reVerifyButtonText: { color: "#E65100", fontSize: 12, fontWeight: "800" },

  // Screen 4 & 5 Styles
  heroHeadingDark: {
    color: "#1C1C1E",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 6,
  },
  dualButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    marginBottom: 10,
  },
  continueOrangeBtn: {
    flex: 1,
    backgroundColor: "#E65100",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E65100",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueOrangeBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },
  getOtpBlueBtn: {
    flex: 1,
    backgroundColor: "#3B82F6",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B82F6",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  getOtpBlueBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },
  googleFullButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#EBE5DF",
    borderRadius: 18,
    paddingVertical: 14,
    marginVertical: 10,
  },
  createAccountLink: {
    alignItems: "center",
    marginTop: 14,
    paddingVertical: 8,
  },
  createAccountLinkText: {
    color: "#4B5563",
    fontSize: 13,
  },
  yourDayTitleText: {
    color: "#1C1C1E",
    fontSize: 18,
    fontWeight: "900",
  },
  locationSelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  locationSelectorText: {
    color: "#E65100",
    fontSize: 13,
    fontWeight: "800",
  },
  filtersRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EBE5DF",
  },
  filterChipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#EBE5DF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipText: {
    color: "#1C1C1E",
    fontSize: 12,
    fontWeight: "700",
  },

  // Vernacular Language Bar
  langPillBarRow: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginBottom: 10,
  },
  langPillItem: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EBE5DF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  langPillItemActive: {
    backgroundColor: "#1C1C1E",
    borderColor: "#1C1C1E",
  },
  langPillText: { color: "#667085", fontSize: 11, fontWeight: "600" },
  langPillTextActive: { color: "#FFFFFF", fontWeight: "800" },

  brandTitleText: { color: "#0284C7", fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  brandSubTaglineText: { color: "#667085", fontSize: 12, marginTop: 2, textAlign: "center" },

  // Phone Input Shell
  phoneInputBoxShell: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#EBE5DF",
    paddingHorizontal: 14,
    minHeight: 52,
    marginBottom: 14,
  },
  countryCodeText: { color: "#1C1C1E", fontSize: 16, fontWeight: "800", marginRight: 8 },
  phoneInputBold: { flex: 1, color: "#1C1C1E", fontSize: 16, fontWeight: "700" },

  btnPrimarySaffron: {
    backgroundColor: "#E65100",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#E65100",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPrimarySaffronText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900", letterSpacing: 0.3 },

  btnWhatsAppFallback: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "rgba(18, 140, 126, 0.3)",
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  btnWhatsAppText: { color: "#128C7E", fontSize: 12, fontWeight: "800" },

  // Role Fork Grid
  roleForkGrid: { flexDirection: "row", gap: 10, marginTop: 10 },
  roleForkCard: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    borderWidth: 1.5,
    borderColor: "#EBE5DF",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
  },
  roleForkCardActive: {
    backgroundColor: "#FFF8F5",
    borderColor: "#E65100",
  },
  roleForkTitle: { color: "#1C1C1E", fontSize: 14, fontWeight: "800", marginTop: 6 },
  roleForkSub: { color: "#667085", fontSize: 10, lineHeight: 14, textAlign: "center", marginTop: 2 },

  // Step 2A / 2B Styles
  stepTitleText: { color: "#1C1C1E", fontSize: 16, fontWeight: "800" },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  checkboxLabelText: { color: "#1C1C1E", fontSize: 13, flex: 1 },

  tradePillCard: {
    borderWidth: 1.5,
    borderColor: "#EBE5DF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FAFAFA",
  },
  tradePillCardActive: {
    backgroundColor: "#FFF8F5",
    borderColor: "#E65100",
  },
  tradePillText: { color: "#667085", fontSize: 12, fontWeight: "700" },
  tradePillTextActive: { color: "#E65100", fontWeight: "900" },

  digiLockerBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(27, 73, 101, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(27, 73, 101, 0.25)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  digiTitleText: { color: "#0284C7", fontSize: 12, fontWeight: "800" },
  digiSubText: { color: "#16A34A", fontSize: 11, fontWeight: "700", marginTop: 2 },

  // WhatsApp OTP Modal Styles
  whatsappOtpModalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#EBE5DF",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  whatsappNotificationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "rgba(18, 140, 126, 0.3)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  whatsappNotifTitle: { color: "#128C7E", fontSize: 11, fontWeight: "800" },
  whatsappNotifBody: { color: "#1C1C1E", fontSize: 12, marginTop: 2 },
  otpPinRow: {
    marginVertical: 14,
  },
  otpPinInput: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1.5,
    borderColor: "#E65100",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "900",
    color: "#1C1C1E",
    letterSpacing: 8,
  },
  autoFillHintButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  autoFillHintText: { color: "#128C7E", fontSize: 12, fontWeight: "800" },
  btnPrimarySaffronFlex: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#E65100",
    borderRadius: 14,
    paddingVertical: 14,
  },

  // Splash Video Styles
  splashContainerCream: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F9F6F0",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  splashVideoCenterFrame: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  splashVideoHeroLogo: {
    width: 220,
    height: 220,
  },
  splashVideoTitleText: {
    color: "#0284C7",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 18,
  },
  splashVideoTaglineText: {
    color: "#667085",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
  },
  videoPlayingBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(230, 81, 0, 0.12)",
    borderWidth: 1,
    borderColor: "#E65100",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 24,
  },
  videoPlayingPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E65100",
  },
  videoPlayingBadgeText: {
    color: "#E65100",
    fontSize: 12,
    fontWeight: "800",
  },
  splashBottomSaffronBar: {
    width: "100%",
    height: 6,
    backgroundColor: "#E65100",
  },

  // Media Choice Modal Styles
  mediaChoiceModalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.5,
    borderColor: "#EBE5DF",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  mediaChoiceGridRow: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 18,
  },
  mediaChoiceBoxBtn: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    borderWidth: 1.5,
    borderColor: "#EBE5DF",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
  },
  mediaChoiceIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(230, 81, 0, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  mediaChoiceTitleText: {
    color: "#1C1C1E",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 2,
  },
  mediaChoiceSubText: {
    color: "#667085",
    fontSize: 10,
    lineHeight: 14,
    textAlign: "center",
  },
  modalCancelButtonFull: {
    width: "100%",
    backgroundColor: "#F8F6F0",
    borderWidth: 1,
    borderColor: "#EBE5DF",
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: "center",
  },
  attachedThumbnailImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#FAFAFA",
  },

  // Live GPS Tracker Styles
  liveGpsPulseCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(22, 163, 74, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  liveGpsPulseDot: { width: 10, height: 10, borderRadius: 5 },
  pulseGreen: { backgroundColor: "#16A34A" },
  pulseGrey: { backgroundColor: "#667085" },
  gpsTogglePillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  gpsActivePill: { backgroundColor: "rgba(22, 163, 74, 0.12)", borderColor: "#16A34A" },
  gpsInactivePill: { backgroundColor: "rgba(102, 112, 133, 0.12)", borderColor: "#667085" },
  gpsActiveText: { color: "#16A34A", fontSize: 11, fontWeight: "800" },
  gpsInactiveText: { color: "#667085", fontSize: 11, fontWeight: "700" },
  gpsCoordBoxShell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#EBE5DF",
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
  },
  gpsLocationTitleText: { color: "#1C1C1E", fontSize: 13, fontWeight: "800" },
  gpsLocationCoordsText: { color: "#4B5563", fontSize: 11, marginTop: 2 },
  gpsLastUpdateText: { color: "#16A34A", fontSize: 10, fontWeight: "700", marginTop: 2 },
  refreshGpsButton: { padding: 4 },

  floatingAiFab: {
    position: "absolute",
    bottom: 85,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FF6B00",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF6B00",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 99,
  },

  // Bidding & Offers System Styles
  biddingRequestCard: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#EBE5DF",
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
  },
  biddingMetaText: { color: "#4B5563", fontSize: 11, fontWeight: "600", marginTop: 6 },
  workerOfferBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EBE5DF",
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
  },
  proposedPriceText: { color: "#E65100", fontSize: 18, fontWeight: "900" },
  estTimeText: { color: "#667085", fontSize: 10, fontWeight: "700" },
  offerNotesText: { color: "#1C1C1E", fontSize: 11, fontStyle: "italic", marginTop: 4 },
  offerActionRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  acceptedBadgeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
  },
  acceptedBadgeText: { color: "#16A34A", fontSize: 11, fontWeight: "800" },
  expiredText: { color: "#94A3B8", fontSize: 10, fontStyle: "italic", marginTop: 4 },
  mySubmittedOfferBox: {
    backgroundColor: "#FFF8F5",
    borderWidth: 1,
    borderColor: "#E65100",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  submittedOfferTitle: { color: "#1C1C1E", fontSize: 12, fontWeight: "800" },

  // Notification Drawer Styles
  notificationModalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#EBE5DF",
  },
  notifItemCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#EBE5DF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  notifItemUnread: {
    backgroundColor: "#FFF8F5",
    borderColor: "#E65100",
  },
  notifIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(230, 81, 0, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  notifItemTitle: { color: "#1C1C1E", fontSize: 13, fontWeight: "800" },
  notifItemMessage: { color: "#4B5563", fontSize: 11, marginTop: 2 },
  notifItemTime: { color: "#94A3B8", fontSize: 10, marginTop: 4 },
  notifHeaderBadgeDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },

  // Dynamic Team Execution Styles
  teamProjectCard: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#EBE5DF",
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
  },
  teamLeaderBadgeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF8F5",
    borderWidth: 1.5,
    borderColor: "#E65100",
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
  },
  teamLeaderTitle: { color: "#E65100", fontSize: 11, fontWeight: "800" },
  teamLeaderNameText: { color: "#1C1C1E", fontSize: 14, fontWeight: "900", marginTop: 2 },
  teamLeaderSubText: { color: "#667085", fontSize: 10, fontWeight: "600", marginTop: 2 },
  teamFormationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(27, 73, 101, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(27, 73, 101, 0.25)",
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  teamFormationText: { color: "#0284C7", fontSize: 11, fontWeight: "800" },
  teamMemberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EBE5DF",
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
  },
  teamMemberNameText: { color: "#1C1C1E", fontSize: 12, fontWeight: "800" },
  teamTaskAssignedText: { color: "#E65100", fontSize: 11, fontStyle: "italic", marginTop: 2 },
  teamMemberRatingText: { color: "#1C1C1E", fontSize: 11, fontWeight: "800" },
  quotationSummaryCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E65100",
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  quotationTitleText: { color: "#1C1C1E", fontSize: 13, fontWeight: "800" },
  teamChatBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EBE5DF",
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  chatMessageItem: {
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    padding: 8,
    marginTop: 6,
  },
  chatSenderNameText: { color: "#0284C7", fontSize: 11, fontWeight: "800" },
  chatTextContent: { color: "#1C1C1E", fontSize: 12, marginTop: 2 },
  chatTimeText: { color: "#94A3B8", fontSize: 9, marginTop: 4, textAlign: "right" },

  // Inline Bidding Card
  inlineBidInputCard: {
    backgroundColor: "#FFF8F5",
    borderWidth: 1.5,
    borderColor: "#E65100",
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
  },
  inlineEstInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EBE5DF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: "#1C1C1E",
  },

  // Hamburger Menu Drawer Styles
  hamburgerDrawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 280,
    backgroundColor: "#FFF9ED", // Milky yellow white
    paddingTop: 50,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  hamburgerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EBE5DF",
  },
  hamburgerTitle: {
    color: "#1C1C1E",
    fontSize: 20,
    fontWeight: "900",
  },
  hamburgerScroll: {
    flex: 1,
  },
  hamburgerDivider: {
    height: 1,
    backgroundColor: "#EBE5DF",
    marginVertical: 15,
  },
  menuOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 6,
  },
  menuOptionBtnActive: {
    backgroundColor: "rgba(2, 132, 199, 0.1)",
  },
  menuOptionText: {
    color: "#4B5563",
    fontSize: 15,
    fontWeight: "700",
  },
  menuOptionTextActive: {
    color: "#0284C7",
    fontWeight: "900",
  },
});
