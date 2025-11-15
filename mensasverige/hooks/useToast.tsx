import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Animated, StyleSheet, View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

export const useToast = (colorScheme: 'light' | 'dark' | null = 'light') => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  });

  const slideAnim = useRef(new Animated.Value(100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({
      visible: true,
      message,
      type,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  useEffect(() => {
    if (toast.visible) {
      // Show toast
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after 2 seconds
      const timer = setTimeout(() => {
        hideToastWithAnimation();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  const hideToastWithAnimation = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      hideToast();
    });
  }, [hideToast, slideAnim, opacityAnim]);

  const getToastStyle = () => {
    const isDark = colorScheme === 'dark';
    const backgroundColor = isDark ? Colors.dark.background50 : Colors.light.background0;
    
    switch (toast.type) {
      case 'success':
        return {
          backgroundColor,
          borderColor: Colors.success500,
        };
      case 'error':
        return {
          backgroundColor,
          borderColor: Colors.error500,
        };
      case 'info':
      default:
        return {
          backgroundColor,
          borderColor: Colors.primary500,
        };
    }
  };

  const getIconStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          color: Colors.success500,
        };
      case 'error':
        return {
          color: Colors.error500,
        };
      case 'info':
      default:
        return {
          color: Colors.primary500,
        };
    }
  };

  const getTextStyle = () => {
    const isDark = colorScheme === 'dark';
    return {
      color: isDark ? Colors.dark.text : Colors.light.text,
    };
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'error';
      case 'info':
      default:
        return 'info';
    }
  };

  const ToastComponent = React.useMemo(() => {
    if (!toast.visible) return null;

    return (
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.toast,
            getToastStyle(),
            {
              transform: [{ translateY: slideAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <MaterialIcons 
            name={getIcon()} 
            size={20} 
            style={getIconStyle()} 
          />
          <Text style={[styles.message, getTextStyle()]}>{toast.message}</Text>
        </Animated.View>
      </View>
    );
  }, [toast.visible, toast.type, toast.message, slideAnim, opacityAnim, colorScheme]);

  return {
    showToast,
    hideToast,
    ToastComponent,
  };
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    padding: 20,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
              borderWidth: 2,
    marginBottom: 10,
    elevation: 3,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginLeft: 10,
  },
});