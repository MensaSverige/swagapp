import { Linking, Pressable, Text, View } from "react-native";
import UserWithLocation from "../types/userWithLocation";
import { timeUntil } from "../../events/utilities/TimeLeft";
import { useEffect, useState } from "react";
import React from "react";

const ContactCard: React.FC<{
    user: UserWithLocation;
    isSelected: boolean;
  }> = ({ user, isSelected }) => {
    const [comparisonDate, setComparisonDate] = useState(new Date());
    useEffect(() => {
    let intervalId = null;

    if (isSelected) {
        intervalId = setInterval(() => {
        setComparisonDate(new Date());
        }, 1000);
    }

    return () => {
        if (intervalId) {
        clearInterval(intervalId);
        }
    };
    }, [isSelected]);
    
    if (!user) {
      return null;
    }
  
    return (
      <View>
        <Text>{user.firstName} {user.lastName}</Text>
        {user.location.timestamp && 
        <Text>{timeUntil(comparisonDate, user.location.timestamp)} sedan</Text>
        }
        {user.contact_info?.email && user.contact_info.email.trim() !== '' && (
          <Pressable
            onPress={() => {
              Linking.openURL(`mailto:${user.contact_info?.email }`);
            }
            }>
            <Text>{user.contact_info.email } </Text>
          </Pressable>
        )}
        {user.contact_info?.phone && user.contact_info.phone.trim() !== '' && (
          <Pressable
            onPress={() => {
              Linking.openURL(`tel:${user.contact_info?.phone}`);
            }}>
            <Text>{user.contact_info.phone}</Text>
          </Pressable>
        )}
      </View>
  
    );
  };

export default React.memo(ContactCard, (prevProps, nextProps) => {
    // Only re-render if the isSelected prop has changed
    return prevProps.isSelected === nextProps.isSelected;
  });