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

interface VerifyEmailProps {
  username: string;
  verificationUrl: string;
}

export const VerifyEmail = ({
  username,
  verificationUrl,
}: VerifyEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Verify your Challenge League email address</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Verify Your Email</Heading>
          <Text style={text}>Hi {username},</Text>
          <Text style={text}>
            Thanks for signing up for Challenge League! Please verify your email address
            to ensure you receive important notifications about challenges and competitions.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={verificationUrl}>
              Verify Email Address
            </Button>
          </Section>
          <Text style={text}>
            This link will expire in 24 hours.
          </Text>
          <Text style={text}>
            If you didn&apos;t create a Challenge League account, you can safely ignore this email.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Challenge League - Where creativity meets competition
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default VerifyEmail;

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
