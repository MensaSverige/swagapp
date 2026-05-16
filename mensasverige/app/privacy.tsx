import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText type="link" style={styles.backButton}>
            ← Tillbaka
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.mainTitle}>
          Sekretesspolicy för Mensa Sverige
        </ThemedText>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            1. Insamling av Personuppgifter
          </ThemedText>
          <ThemedText style={styles.sectionText}>
            När du loggar in på vår app samlar vi in två typer av personuppgifter: ditt namn och ditt
            användarnamn, som normalt är din e-postadress. Dessa uppgifter används för att identifiera
            dig i appen och för att visa evenemang och andra medlemmar på kartan.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            2. Användning av Personuppgifter
          </ThemedText>
          <ThemedText style={styles.sectionText}>
            Dina personuppgifter, som inkluderar ditt namn och användarnamn/e-postadress, används
            enbart för de syften som beskrivs ovan och delas inte med några tredje parter.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            3. Platsdata
          </ThemedText>
          <ThemedText style={styles.sectionText}>
            Appen kan begära åtkomst till din enhets platstjänster för att visa din position på kartan
            i förhållande till evenemang och andra medlemmar. Platsdelning är helt frivillig och kräver
            ditt uttryckliga samtycke via operativsystemets behörighetsdialog. Du kan när som helst
            återkalla detta samtycke genom enhetens inställningar utan att förlora övrig funktionalitet
            i appen.
          </ThemedText>
          <ThemedText style={styles.sectionText}>
            Din position används endast inom appen för att förbättra din upplevelse och delas inte med
            några tredje parter. Platsdata används inte för marknadsföring, profilering eller spårning
            av dina rörelser över tid. Om du väljer att dela din position med andra medlemmar lagras
            den senast kända positionen i vår databas tills du själv tar bort den, stänger av
            platsdelning, eller raderar ditt konto.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            4. Lagring och Säkerhet
          </ThemedText>
          <ThemedText style={styles.sectionText}>
            Dina personuppgifter lagras säkert i en MongoDB-databas på en Ubuntu-server. För att skydda
            dina uppgifter kräver vi tvåfaktorsautentisering för all åtkomst till databasen.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            5. Tillgång och Radering av Personuppgifter
          </ThemedText>
          <ThemedText style={styles.sectionText}>
            Som användare av Mensa Sverige har du rätt att få tillgång till och radera dina
            personuppgifter. För att begära detta, vänligen kontakta Mikael Grön på
            skaramicke@gmail.com. Vi kommer att skyndsamt hantera din begäran och radera alla spår av
            dina uppgifter från vår databas.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 14,
    paddingVertical: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  mainTitle: {
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
});
