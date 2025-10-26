// Layout Components
export {
  LayoutShell,
  LayoutMain,
  LayoutContent,
  LayoutContainer,
} from './layout';

export {
  SidebarProvider,
  useSidebar,
} from './sidebar-context';

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarNav,
  SidebarNavItem,
} from './sidebar';

export {
  Topbar,
  TopbarContent,
  TopbarTitle,
  TopbarActions,
} from './topbar';

// Form Components
export { Button } from './button';
export { Input } from './input';
export { Textarea } from './textarea';

// UI Components
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card';

export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalContent,
  ModalFooter,
} from './modal';

export {
  Tooltip,
  SimpleTooltip,
} from './tooltip';

// Icons
export {
  Icon,
  // Re-export commonly used icons
  Menu,
  X,
  Search,
  Settings,
  User,
  LogOut,
  Plus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  Send,
  Trash2,
  Edit2,
  Copy,
  Check,
  AlertCircle,
  Info,
  Loader2,
  ExternalLink,
  Download,
  Upload,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Zap,
  Star,
  Heart,
  Share2,
  MoreVertical,
  MoreHorizontal,
} from './icon';

// Types
export type { IconProps } from './icon';
export type { SidebarProviderProps } from './sidebar-context';
export type { SidebarProps, SidebarNavItemProps } from './sidebar';
export type { TopbarProps } from './topbar';
export type { LayoutShellProps } from './layout';
export type { TextareaProps } from './textarea';
export type { ModalProps } from './modal';
export type { TooltipProps, SimpleTooltipProps } from './tooltip';
