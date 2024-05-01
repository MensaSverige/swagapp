import React from "react";
import { 
  Badge,
  Icon 
} from "../../../gluestack-components";
import { 
  DicesIcon,
  FootprintsIcon,
  GlobeIcon, HandIcon,
  MicVocalIcon, PresentationIcon,
  SparklesIcon
} from "lucide-react-native";

export interface EventBadgesProps {
    color: string;
    size?: number;
  }


export const DinnerBadge: React.FC<EventBadgesProps> = ({ color, size }) => (
  <Badge size="sm" bgColor={color} variant="solid" borderRadius="$full" ml="$1">
  <Icon as={SparklesIcon} color="#fff" />
</Badge>
);

export const FootprintsBadge: React.FC<EventBadgesProps> = ({ color, size }) => (
  <Badge size="sm" bgColor={color} variant="solid" borderRadius="$full" ml="$1">
  <Icon as={FootprintsIcon} color="#fff" />
</Badge>
);

export const GameBadge: React.FC<EventBadgesProps> = ({ color, size }) => (
  <Badge size="sm" bgColor={color} variant="solid" borderRadius="$full" ml="$1">
  <Icon as={DicesIcon} color="#fff" />
</Badge>
);

export const GlobeBadge: React.FC<EventBadgesProps> = ({ color, size }) => (
  <Badge size="sm" bgColor={color} variant="solid" borderRadius="$full" ml="$1">
  <Icon as={GlobeIcon} color="#fff" />
</Badge>
);

export const PartyBadge: React.FC<EventBadgesProps> = ({ color, size }) => (
  <Badge size="sm" bgColor={color} variant="solid" borderRadius="$full" ml="$1">
  <Icon as={SparklesIcon} color="#fff" />
</Badge>
);

export const MicVocalBadge: React.FC<EventBadgesProps> = ({ color, size }) => (
  <Badge size="sm" bgColor={color} variant="solid" borderRadius="$full" ml="$1">
  <Icon as={MicVocalIcon} color="#fff" />
</Badge>
);

export const LectureBadge: React.FC<EventBadgesProps> = ({ color, size }) => (
  <Badge size="sm" bgColor={color} variant="solid" borderRadius="$full" ml="$1">
  <Icon as={PresentationIcon} color="#fff" />
</Badge>
);

export const WorkshopBadge: React.FC<EventBadgesProps> = ({ color, size }) => (
  <Badge size="sm" bgColor={color} variant="solid" borderRadius="$full" ml="$1">
  <Icon as={HandIcon} color="#fff" />
</Badge>
);



