// packages/ui-kit/src/index.ts
// Barrel export — import anything from '@shram-sangam/ui-kit'

export { Button } from './components/button';
export type { ButtonProps } from './components/button';

export { Badge, StatusBadge, BOOKING_STATUS_VARIANT } from './components/badge';
export type { BadgeProps, BadgeVariant } from './components/badge';

export { Card, CardHeader, CardTitle, CardDescription } from './components/card';
export type { CardProps } from './components/card';

export { FeeBreakdown } from './components/fee-breakdown';
export type { FeeBreakdownProps } from './components/fee-breakdown';

export { StatBox } from './components/stat-box';
export type { StatBoxProps } from './components/stat-box';

export { Input, Textarea } from './components/input';
export type { InputProps, TextareaProps } from './components/input';

export { Spinner, PageLoader } from './components/spinner';
export type { SpinnerProps } from './components/spinner';

export { ToastProvider, useToast } from './components/toast';
export type { Toast, ToastType } from './components/toast';

export { Modal } from './components/modal';
export type { ModalProps } from './components/modal';

export { QuorumGauge } from './components/quorum-gauge';
export type { QuorumGaugeProps } from './components/quorum-gauge';

export { NavBar } from './components/nav';
export type { NavBarProps, NavItem } from './components/nav';

export { Countdown } from './components/countdown';
export type { CountdownProps } from './components/countdown';

// Utility helpers
export { cn, formatINR, formatDate, formatDateTime, timeUntil, computeFees } from './lib/utils';
