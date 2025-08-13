/**
 * Route: react-email-starter/emails/agenitix-magic-link.tsx
 * AGENITIX MAGIC LINK EMAIL TEMPLATE - React Email component for authentication
 *
 * • Professional design following Vercel invite pattern
 * • AgenitiX branding with gradient header and logo
 * • Clean layout with proper security messaging
 * • Accessible design with proper contrast and typography
 *
 * Keywords: react-email, magic-link, authentication, agenitix-branding
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface AgenitiXMagicLinkEmailProps {
  name?: string;
  magicLinkUrl?: string;
  type?: "verification" | "login";
  requestFromIp?: string;
  requestFromLocation?: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_APP_URL || "https://agenitix.com";

export const AgenitiXMagicLinkEmail = ({
  name = "User",
  magicLinkUrl = "#",
  type = "login",
  requestFromIp,
  requestFromLocation,
}: AgenitiXMagicLinkEmailProps) => {
  const isVerification = type === "verification";
  const previewText = isVerification
    ? `Welcome to AgenitiX - Verify your account`
    : `Sign in to AgenitiX - Your magic link is ready`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-[#eaeaea] border-solid p-[20px]">
            {/* Header with AgenitiX Branding */}
            <Section className="mt-[32px] text-center">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 mb-8">
                <Img
                  src={`${baseUrl}/logomark-dark-light/logomark-light.png`}
                  width="48"
                  height="48"
                  alt="AgenitiX"
                  className="mx-auto my-0"
                />
                <Heading className="mx-0 my-[16px] p-0 text-center font-bold text-[28px] text-white">
                  {isVerification
                    ? "Welcome to AgenitiX!"
                    : "Sign in to AgenitiX"}
                </Heading>
                <Text className="mx-0 my-0 text-center text-[16px] text-white/90">
                  {isVerification
                    ? "Visual Flow Automation Platform"
                    : "Your magic link is ready"}
                </Text>
              </div>
            </Section>

            {/* Main Content */}
            <Text className="text-[16px] text-black leading-[24px]">
              Hello {name},
            </Text>

            <Text className="text-[16px] text-black leading-[24px]">
              {isVerification ? (
                <>
                  Thanks for signing up! You're just one click away from
                  building powerful automation workflows. Click the button below
                  to verify your account and get started.
                </>
              ) : (
                <>
                  Click the button below to sign in to your AgenitiX account and
                  continue building your automation workflows.
                </>
              )}
            </Text>

            {/* CTA Button */}
            <Section className="mt-[32px] mb-[32px] text-center">
              <Button
                className="rounded bg-[#3b82f6] px-6 py-4 text-center font-semibold text-[16px] text-white no-underline shadow-lg"
                href={magicLinkUrl}
              >
                {isVerification
                  ? "✨ Verify Account & Sign In"
                  : "🚀 Sign In to AgenitiX"}
              </Button>
            </Section>

            {/* Fallback Link */}
            <Text className="text-[14px] text-black leading-[24px]">
              or copy and paste this URL into your browser:{" "}
              <Link
                href={magicLinkUrl}
                className="text-blue-600 no-underline break-all"
              >
                {magicLinkUrl}
              </Link>
            </Text>

            {/* Security Notice */}
            <Section className="mt-[24px] mb-[24px] bg-[#f9fafb] rounded-lg p-4 border-l-4 border-l-blue-500">
              <Text className="text-[14px] text-gray-600 leading-[20px] m-0">
                <strong>Security note:</strong> This link will expire in 15
                minutes{isVerification ? " for your security" : ""}.
                {isVerification
                  ? " If you didn't create an account, you can safely ignore this email."
                  : " If you didn't request this, you can safely ignore this email."}
              </Text>
            </Section>

            <Hr className="mx-0 my-[26px] w-full border border-[#eaeaea] border-solid" />

            {/* Footer with Security Info */}
            {(requestFromIp || requestFromLocation) && (
              <Text className="text-[#666666] text-[12px] leading-[20px]">
                This request was sent from{" "}
                <span className="text-black">{requestFromIp}</span>
                {requestFromLocation && (
                  <>
                    {" "}
                    located in{" "}
                    <span className="text-black">{requestFromLocation}</span>
                  </>
                )}
                . If you are concerned about your account's safety, please
                contact our support team.
              </Text>
            )}

            {/* Company Footer */}
            <Text className="text-[#666666] text-[12px] leading-[20px] text-center mt-[20px]">
              © 2025 AgenitiX. All rights reserved.
              <br />
              <Link
                href={`${baseUrl}/privacy`}
                className="text-blue-600 no-underline"
              >
                Privacy Policy
              </Link>
              {" • "}
              <Link
                href={`${baseUrl}/terms`}
                className="text-blue-600 no-underline"
              >
                Terms of Service
              </Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

AgenitiXMagicLinkEmail.PreviewProps = {
  name: "John Doe",
  magicLinkUrl: "https://agenitix.com/auth/verify?token=abc123",
  type: "verification",
  requestFromIp: "192.168.1.1",
  requestFromLocation: "San Francisco, CA",
} as AgenitiXMagicLinkEmailProps;

export default AgenitiXMagicLinkEmail;
