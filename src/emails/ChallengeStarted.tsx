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
  appUrl: string;
  unsubscribeToken: string;
  previousChallenge?: {
    text: string;
    challengeNumber: number;
    topSubmissions: Array<{
      rank: number;
      username: string;
      caption: string;
      imageUrl: string;
      votes: number;
    }>;
  };
}

export const ChallengeStartedEmail = ({
  username,
  leagueName,
  challengeText,
  challengeUrl,
  submissionDeadline,
  appUrl,
  unsubscribeToken,
  previousChallenge,
}: ChallengeStartedEmailProps) => {
  const unsubscribeUrl = `${appUrl}/app/unsubscribe?token=${unsubscribeToken}`;

  // Extract league ID from challenge URL for results link
  const leagueId = challengeUrl.split('/league/')[1];
  const resultsUrl = leagueId && previousChallenge
    ? `${appUrl}/app/league/${leagueId}?tab=results`
    : challengeUrl;

  return (
    <Html>
      <Head />
      <Preview>{challengeText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo Header */}
          <Section style={logoSection}>
            <img
              src={`${appUrl}/logo.png`}
              alt="Challenge League"
              style={logo}
            />
          </Section>

          {/* Main Greeting */}
          <Text style={greeting}>
            A new challenge has started in <strong style={strong}>{leagueName}</strong>
          </Text>

          {/* Challenge Text */}
          <Section style={challengeBox}>
            <Text style={challengeTextStyle}>{challengeText}</Text>
          </Section>

          <Text style={deadlineText}>
            Submit your response before{' '}
            <strong style={strong}>{submissionDeadline}</strong>
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={challengeUrl}>
              Submit Your Photo Now
            </Button>
          </Section>

          {/* Previous Challenge Results Section */}
          {previousChallenge && previousChallenge.topSubmissions.length > 0 && (
            <>
              <Hr style={hr} />
              <Heading style={h2}>
                Challenge #{previousChallenge.challengeNumber} Results
              </Heading>
              <Text style={previousChallengeText}>
                {previousChallenge.text}
              </Text>

              {previousChallenge.topSubmissions.map((submission) => (
                <Section key={submission.rank} style={winnerBox}>
                  <Text style={rankBadge}>
                    {submission.rank === 1 ? '🥇' : submission.rank === 2 ? '🥈' : '🥉'}{' '}
                    {submission.rank === 1 ? '1st Place' : submission.rank === 2 ? '2nd Place' : '3rd Place'}{' '}
                    ({submission.votes} {submission.votes === 1 ? 'vote' : 'votes'})
                  </Text>
                  <img
                    src={submission.imageUrl}
                    alt={`${submission.rank}${submission.rank === 1 ? 'st' : submission.rank === 2 ? 'nd' : 'rd'} place submission`}
                    style={winnerImage}
                  />
                  <Text style={winnerCaption}>
                    {submission.caption}
                  </Text>
                  <Text style={winnerUsername}>
                    by @{submission.username}
                  </Text>
                </Section>
              ))}

              {/* Full Results Button */}
              <Section style={buttonContainer}>
                <Button style={secondaryButton} href={resultsUrl}>
                  Full Challenge Results
                </Button>
              </Section>
            </>
          )}

          <Hr style={hr} />
          <Text style={footer}>
            <a href={unsubscribeUrl} style={unsubscribeLink}>
              Unsubscribe from email notifications
            </a>
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

const logoSection = {
  textAlign: 'center' as const,
  margin: '32px 0 24px 0',
};

const logo = {
  width: '80px',
  height: '80px',
  display: 'inline-block',
};

const greeting = {
  color: '#ffffff',
  fontSize: '18px',
  lineHeight: '28px',
  margin: '24px 0',
  textAlign: 'center' as const,
  fontWeight: '500',
};

const text = {
  color: '#a3a3a3',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
};

const deadlineText = {
  color: '#a3a3a3',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
  textAlign: 'center' as const,
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
  fontSize: '20px',
  fontWeight: '500',
  lineHeight: '30px',
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

const secondaryButton = {
  backgroundColor: 'transparent',
  border: '2px solid #404040',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 32px',
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

const h2 = {
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '24px 0 16px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const winnerBox = {
  backgroundColor: '#1a1a1a',
  border: '1px solid #404040',
  borderRadius: '8px',
  padding: '24px',
  margin: '16px 0',
  textAlign: 'center' as const,
};

const winnerImage: React.CSSProperties = {
  width: '100%',
  maxWidth: '400px',
  maxHeight: '500px',
  height: 'auto',
  borderRadius: '8px',
  marginBottom: '16px',
  display: 'block',
  marginLeft: 'auto',
  marginRight: 'auto',
  objectFit: 'contain',
};

const winnerCaption: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '12px 0 8px 0',
  textAlign: 'center',
};

const winnerUsername = {
  color: '#3a8e8c',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
  textAlign: 'center' as const,
};

const rankBadge = {
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
  textAlign: 'center' as const,
};

const previousChallengeText = {
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '500',
  lineHeight: '24px',
  margin: '8px 0 24px 0',
  textAlign: 'center' as const,
};

const unsubscribeLink = {
  color: '#737373',
  fontSize: '12px',
  textDecoration: 'underline',
};
