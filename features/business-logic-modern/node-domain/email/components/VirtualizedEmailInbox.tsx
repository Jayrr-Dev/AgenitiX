"use client";
/**
 * Route: features/business-logic-modern/node-domain/email/components/VirtualizedEmailInbox.tsx
 * VIRTUALIZED EMAIL INBOX – Outlook-style email list with TanStack Virtual
 *
 * • Uses TanStack Virtual for efficient rendering of large email lists
 * • Outlook carbon copy styling with sender, subject, date, read status
 * • Hover effects and selection highlighting matching Outlook design
 * • Collapsible interface replacing traditional dropdown navigation
 * • Performance optimized for thousands of emails
 *
 * Keywords: tanstack-virtual, outlook-inbox, email-list, virtualization
 */

import { useVirtualizer } from "@tanstack/react-virtual";
import { memo, useCallback, useMemo, useRef } from "react";
import { MdAttachFile, MdMail, MdMailOutline } from "react-icons/md";

// Outlook-inspired constants, basically classic email client spacing and colors
const INBOX_CONSTANTS = {
  itemHeight: 44, // Smaller height for 10px text
  overscan: 5, // Number of items to render outside visible area
  maxHeight: 400, // Maximum inbox height before scrolling
  borderRadius: "4px",
} as const;

// Outlook carbon copy styling tokens
const OUTLOOK_STYLES = {
  container: `
    border border-[--node-email-border]
    bg-[--node-email-bg] dark:bg-[hsl(0, 0%, 16%)]
    rounded-lg
    p-0
    m-1
    overflow-hidden
    shadow-sm
    h-[90%]
    flex
    flex-col
    mt-4
    bg-black/30
  `,
  scrollContainer: `
    flex-1
    overflow-auto
    scrollbar-thin
    scrollbar-track-transparent
    scrollbar-thumb-gray-300
    dark:scrollbar-thumb-gray-600
    min-h-0

  `,
  virtualItem: `
    absolute
    top-0
    left-0
    w-full
    px-3
    py-2
    border-t-1
    border-[--node-email-border]
    cursor-pointer
    transition-all
    duration-150
    hover:bg-[--node-email-bg-hover]
    dark:hover:bg-[--node-email-bg-hover]
    flex
    items-center
    gap-3
  `,
  selectedItem: `
    bg-[--node-email-bg-hover]
    dark:bg-[--node-email-bg-hover]
    border-l-4
    border-l-[--node-email-border-hover]
  `,
  unreadItem: `
    bg-[--node-email-bg]
    dark:bg-[--node-email-bg]
    font-semibold
  `,
  readItem: `
    bg-[--node-email-bg]
    dark:bg-[--node-email-bg]
    opacity-85
  `,
  mailIcon: `
    flex-shrink-0
    w-4
    h-4
    text-[--node-email-text-secondary]
    dark:text-[--node-email-text-secondary]
  `,
  unreadMailIcon: `
    text-[--node-email-text]
    dark:text-[--node-email-text]
  `,
  senderSection: `
    min-w-0
    flex-1
    mr-2
  `,
  senderName: `
    font-medium
    text-[10px]
    text-[--node-email-text]
    dark:text-[--node-email-text]
    truncate
  `,
  unreadSenderName: `
    font-bold
    text-[--node-email-text]
    dark:text-[--node-email-text]
  `,
  subject: `
    text-[10px]
    text-[--node-email-text-secondary]
    dark:text-[--node-email-text-secondary]
    truncate
    mt-0
  `,
  unreadSubject: `
    font-semibold
    text-[--node-email-text]
    dark:text-[--node-email-text]
  `,
  metaSection: `
    flex-shrink-0
    text-right
    flex
    flex-col
    items-end
    gap-1
  `,
  date: `
    text-[10px]
    text-[--node-email-text-secondary]
    dark:text-[--node-email-text-secondary]
    font-normal
  `,
  unreadDate: `
    font-semibold
    text-[--node-email-text]
    dark:text-[--node-email-text]
  `,
  attachmentIcon: `
    w-3
    h-3
    text-[--node-email-text-secondary]
    dark:text-[--node-email-text-secondary]
  `,
  emptyState: `
    flex
    items-center
    justify-center
    h-32
    text-[--node-email-text-secondary]
    dark:text-[--node-email-text-secondary]
    text-[10px]
  `,
} as const;

// Email data interface, basically structured email info
interface EmailItem {
  id: string;
  subject: string;
  from: string;
  fromName: string;
  fromEmail: string;
  date: string;
  preview: string;
  content: string;
  attachmentsCount: number;
  isRead: boolean;
}

interface VirtualizedEmailInboxProps {
  emails: Array<Record<string, unknown>>;
  selectedIndex: number;
  onEmailSelect: (index: number) => void;
  onEmailDoubleClick?: () => void; // New prop for double-click to expand
  isEnabled?: boolean;
  maxHeight?: number;
}

/**
 * Parse and normalize email data, basically convert raw email objects to structured format
 */
function parseEmailItem(
  email: Record<string, unknown>,
  index: number
): EmailItem {
  // Handle nested email structure (e.g., "Email 1": { ... })
  let emailData = email;
  const keys = Object.keys(email);
  if (keys.length === 1 && /^(Email\s*\d+|email\s*\d+)$/i.test(keys[0])) {
    const nested = email[keys[0]];
    if (nested && typeof nested === "object") {
      emailData = nested as Record<string, unknown>;
    }
  }

  // Extract sender information
  const fromRaw = emailData.From || emailData.from || "";
  let fromName = "";
  let fromEmail = "";
  let fromDisplay = "";

  if (typeof fromRaw === "object" && fromRaw) {
    const fromObj = fromRaw as Record<string, unknown>;
    fromName = String(fromObj.name || "").trim();
    fromEmail = String(fromObj.email || "").trim();
    fromDisplay = fromName || fromEmail;
  } else if (typeof fromRaw === "string") {
    // Parse "Name <email>" format
    const match = fromRaw.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
    if (match) {
      fromName = match[1]?.trim() || "";
      fromEmail = match[2]?.trim() || "";
      fromDisplay = fromName || fromEmail;
    } else {
      fromDisplay = fromRaw.trim();
      if (fromRaw.includes("@")) {
        fromEmail = fromRaw.trim();
      } else {
        fromName = fromRaw.trim();
      }
    }
  }

  // Extract read status
  let isRead = false;
  const readField = emailData.isRead || emailData.Read || emailData.read;
  if (typeof readField === "boolean") {
    isRead = readField;
  } else if (typeof readField === "string") {
    isRead =
      readField.toLowerCase() === "true" || readField.toLowerCase() === "yes";
  }

  // Extract attachments count
  let attachmentsCount = 0;
  const attachmentsRaw =
    emailData.HasAttachments ||
    emailData.hasAttachments ||
    emailData.attachments;
  if (typeof attachmentsRaw === "string") {
    const match = attachmentsRaw.match(/(\d+)/);
    if (match) {
      attachmentsCount = parseInt(match[1], 10) || 0;
    } else if (attachmentsRaw.toLowerCase().includes("yes")) {
      attachmentsCount = 1;
    }
  } else if (typeof attachmentsRaw === "number") {
    attachmentsCount = attachmentsRaw;
  } else if (Array.isArray(attachmentsRaw)) {
    attachmentsCount = attachmentsRaw.length;
  }

  // Format date for display, basically parse various date formats
  let displayDate = "";
  const dateRaw =
    emailData.Date ||
    emailData.date ||
    emailData.timestamp ||
    emailData.sentDate ||
    emailData.receivedDate ||
    "";

  if (dateRaw) {
    try {
      // Handle timestamp numbers (Unix timestamps)
      let dateValue = dateRaw;
      if (
        typeof dateRaw === "number" ||
        (typeof dateRaw === "string" && /^\d+$/.test(dateRaw))
      ) {
        const timestamp = Number(dateRaw);
        // Check if it's in seconds (Unix) or milliseconds
        dateValue = timestamp > 1000000000000 ? timestamp : timestamp * 1000;
      }

      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        const now = new Date();
        // Compare dates by day, not by exact time, basically check if same calendar day
        const nowDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const emailDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        );
        const diffDays = Math.floor(
          (nowDate.getTime() - emailDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 0) {
          // Today: show time like "11:36 PM"
          displayDate = date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        } else {
          // All other dates: show day and date like "Fri 07-21"
          const weekday = date.toLocaleDateString("en-US", {
            weekday: "short",
          });
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          displayDate = `${weekday} ${month}-${day}`;
        }
      } else {
        // Fallback to raw string if date parsing fails
        displayDate = String(dateRaw).substring(0, 10);
      }
    } catch {
      displayDate = String(dateRaw).substring(0, 10);
    }
  }

  // Debug fallback - if no date found, show placeholder
  if (!displayDate) {
    displayDate = "No date";
  }

  return {
    id: `email-${index}`,
    subject: String(emailData.Subject || emailData.subject || "(No subject)"),
    from: fromDisplay,
    fromName,
    fromEmail,
    date: displayDate,
    preview: String(
      emailData.Preview || emailData.preview || emailData.snippet || ""
    ),
    content: String(
      emailData.Content || emailData.content || emailData.textContent || ""
    ),
    attachmentsCount,
    isRead,
  };
}

/**
 * Individual email row component, basically single inbox item with Outlook styling
 */
const EmailRow = memo(
  ({
    email,
    isSelected,
    onClick,
    onDoubleClick,
    style,
  }: {
    email: EmailItem;
    isSelected: boolean;
    onClick: () => void;
    onDoubleClick?: () => void;
    style: React.CSSProperties;
  }) => {
    // Dynamic classes based on email state, basically conditional styling like Outlook
    const itemClasses = useMemo(() => {
      const base = OUTLOOK_STYLES.virtualItem;
      const readState = email.isRead
        ? OUTLOOK_STYLES.readItem
        : OUTLOOK_STYLES.unreadItem;
      const selection = isSelected ? OUTLOOK_STYLES.selectedItem : "";
      return `${base} ${readState} ${selection}`.trim();
    }, [email.isRead, isSelected]);

    const senderClasses = useMemo(() => {
      const base = OUTLOOK_STYLES.senderName;
      const unread = email.isRead ? "" : OUTLOOK_STYLES.unreadSenderName;
      return `${base} ${unread}`.trim();
    }, [email.isRead]);

    const subjectClasses = useMemo(() => {
      const base = OUTLOOK_STYLES.subject;
      const unread = email.isRead ? "" : OUTLOOK_STYLES.unreadSubject;
      return `${base} ${unread}`.trim();
    }, [email.isRead]);

    const dateClasses = useMemo(() => {
      const base = OUTLOOK_STYLES.date;
      const unread = email.isRead ? "" : OUTLOOK_STYLES.unreadDate;
      return `${base} ${unread}`.trim();
    }, [email.isRead]);

    const mailIconClasses = useMemo(() => {
      const base = OUTLOOK_STYLES.mailIcon;
      const unread = email.isRead ? "" : OUTLOOK_STYLES.unreadMailIcon;
      return `${base} ${unread}`.trim();
    }, [email.isRead]);

    return (
      <div
        style={style}
        className={itemClasses}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        aria-label={`Email from ${email.from}: ${email.subject}`}
      >
        {/* Mail icon indicator, basically read/unread visual cue */}
        {email.isRead ? (
          <MdMailOutline className={mailIconClasses} />
        ) : (
          <MdMail className={mailIconClasses} />
        )}

        {/* Sender and subject section */}
        <div className={OUTLOOK_STYLES.senderSection}>
          <div className="flex items-center justify-between gap-2">
            <div
              className={`${senderClasses} flex-1 min-w-0`}
              title={email.from}
            >
              {email.fromName || email.from}
            </div>
            <div className={`${dateClasses} flex-shrink-0`}>{email.date}</div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div
              className={`${subjectClasses} flex-1 min-w-0`}
              title={email.subject}
            >
              {email.subject}
            </div>
            {email.attachmentsCount > 0 && (
              <MdAttachFile
                className={`${OUTLOOK_STYLES.attachmentIcon} flex-shrink-0`}
                title={`${email.attachmentsCount} attachment${email.attachmentsCount !== 1 ? "s" : ""}`}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
);

EmailRow.displayName = "EmailRow";

/**
 * Main virtualized email inbox component, basically Outlook-style email list
 */
export const VirtualizedEmailInbox = memo(
  ({
    emails,
    selectedIndex,
    onEmailSelect,
    onEmailDoubleClick,
    isEnabled = true,
    maxHeight = INBOX_CONSTANTS.maxHeight,
  }: VirtualizedEmailInboxProps) => {
    const parentRef = useRef<HTMLDivElement>(null);

    // Parse emails into structured format, basically normalize data for consistent rendering
    const parsedEmails = useMemo(
      () => emails.map((email, index) => parseEmailItem(email, index)),
      [emails]
    );

    // TanStack Virtual configuration, basically efficient list rendering setup
    const virtualizer = useVirtualizer({
      count: parsedEmails.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => INBOX_CONSTANTS.itemHeight,
      overscan: INBOX_CONSTANTS.overscan,
    });

    // Handle email selection, basically user interaction callback
    const handleEmailClick = useCallback(
      (index: number) => {
        if (isEnabled) {
          onEmailSelect(index);
        }
      },
      [isEnabled, onEmailSelect]
    );

    // Dynamic container height, basically responsive sizing that prevents overflow
    const containerHeight = useMemo(() => {
      if (parsedEmails.length === 0) return 120; // Fixed height for empty state
      const totalHeight = parsedEmails.length * INBOX_CONSTANTS.itemHeight;
      const minHeight = Math.min(2 * INBOX_CONSTANTS.itemHeight, totalHeight); // At least 2 rows
      return Math.min(totalHeight + 40, maxHeight); // +40 for status bar
    }, [parsedEmails.length, maxHeight]);

    // Empty state when no emails, basically user guidance
    if (parsedEmails.length === 0) {
      return (
        <div className={OUTLOOK_STYLES.container}>
          <div className={OUTLOOK_STYLES.emptyState}>
            <div className="text-center">
              <MdMailOutline className="mx-auto mb-2 h-6 w-6 opacity-50" />
              <div>No emails to display</div>
              <div className="text-xs text-[--node-email-text-secondary] mt-1">
                Connect an email source to see messages
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={OUTLOOK_STYLES.container}>
        {/* Email count indicator, basically status information */}
        <div className="flex-shrink-0 px-3 bg-[--node-email-bg-hover] dark:bg-[--node-email-bg-hover] border-b border-[--node-email-border] dark:border-[--node-email-border]">
          <div className="flex justify-between items-center text-[8px] text-[--node-email-text-secondary] dark:text-[--node-email-text-secondary]">
            <span>{parsedEmails.length} emails</span>
            <span>
              {selectedIndex + 1} of {parsedEmails.length} selected
            </span>
          </div>
        </div>
        <div
          ref={parentRef}
          className={OUTLOOK_STYLES.scrollContainer}
          style={{ height: `${Math.max(120, containerHeight - 40)}px` }} // Reserve space for status bar
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const email = parsedEmails[virtualItem.index];
              const isSelected = virtualItem.index === selectedIndex;

              return (
                <EmailRow
                  key={virtualItem.key}
                  email={email}
                  isSelected={isSelected}
                  onClick={() => handleEmailClick(virtualItem.index)}
                  onDoubleClick={onEmailDoubleClick}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);

VirtualizedEmailInbox.displayName = "VirtualizedEmailInbox";

export default VirtualizedEmailInbox;
