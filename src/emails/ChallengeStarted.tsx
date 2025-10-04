import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ChallengeStartedEmailProps {
  username: string;
  leagueName: string;
  challengeText: string;
  challengeUrl: string;
  submissionDeadline: string;
}

export const ChallengeStartedEmail = ({
  username,
  leagueName,
  challengeText,
  challengeUrl,
  submissionDeadline,
}: ChallengeStartedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>New challenge in {leagueName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎯 New Challenge!</Heading>
          <Text style={text}>Hi {username},</Text>
          <Text style={text}>
            A new challenge has started in <strong style={strong}>{leagueName}</strong>:
          </Text>
          <Section style={challengeBox}>
            <Text style={challengeTextStyle}>&ldquo;{challengeText}&rdquo;</Text>
          </Section>
          <Text style={text}>
            Time to get creative! Submit your response before{' '}
            <strong style={strong}>{submissionDeadline}</strong>.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={challengeUrl}>
              Submit Your Entry
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Challenge League - Where creativity meets competition
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default ChallengeStartedEmail;

// Styles
const main = {
  backgroundColor: '#000000',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#a3a3a3',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
};

const strong = {
  color: '#ffffff',
};

const challengeBox = {
  backgroundColor: '#1a1a1a',
  border: '1px solid #404040',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const challengeTextStyle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '500',
  lineHeight: '28px',
  margin: '0',
  textAlign: 'center',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#3a8e8c',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const hr = {
  borderColor: '#404040',
  margin: '32px 0',
};

const footer = {
  color: '#737373',
  fontSize: '12px',
  textAlign: 'center' as const,
  marginTop: '32px',
};
