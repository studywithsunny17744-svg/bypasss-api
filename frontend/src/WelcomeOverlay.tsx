import { useRef } from 'react';
import { motion } from 'motion/react';
import './WelcomeOverlay.css';

interface WelcomeOverlayProps {
  displayName: string;
  role: string;
  avatar?: string;
  onClose: () => void;
}

export default function WelcomeOverlay({ displayName, role, avatar, onClose }: WelcomeOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Logo SVG matches the main sidebar avatar brand icon
  const LogoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="var(--accent-cyan)" className="welcome-badge-logo">
      <path d="M12 2L2 22h20L12 2zm0 3.99L18.86 19H5.14L12 5.99zM11 11h2v4h-2v-4zm0 6h2v2h-2v-2z" />
    </svg>
  );

  return (
    <div className="welcome-overlay-container" ref={containerRef}>
      {/* Background blur overlays */}
      <div className="welcome-overlay-background" onClick={onClose} />

      {/* Top Header Row with Close/Continue button */}
      <div className="welcome-overlay-header">
        <button className="welcome-continue-btn" onClick={onClose}>
          Continue <span className="close-x">×</span>
        </button>
      </div>

      <div className="welcome-overlay-content">

        {/* LEFT COLUMN: Hanging Lanyard and Draggable ID Card */}
        <div className="welcome-badge-column">

          {/* Lanyard String & Clip - Visual anchors */}
          <div className="lanyard-thread" />
          <div className="lanyard-clip" />

          {/* Interactive Badge Card */}
          <motion.div
            className="welcome-id-badge"
            drag
            dragConstraints={{ left: -140, right: 140, top: -60, bottom: 60 }}
            dragElastic={0.4}
            dragTransition={{ bounceStiffness: 400, bounceDamping: 22 }}
            whileDrag={{ scale: 1.05, rotate: 2 }}
            animate={{
              y: [0, -10, 0],
              rotate: [0, -1, 1, 0]
            }}
            transition={{
              y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 7, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            {/* Holographic gloss card overlay */}
            <div className="hologram-shimmer" />

            {/* Badge Body */}
            <div className="badge-header">
              <div className="badge-logo-container">
                <LogoIcon />
              </div>
              <div className="badge-title-info">
                <span className="badge-title">MANI272</span>
                <span className="badge-subtitle">BYPASS MODULE</span>
              </div>
            </div>

            <div className="badge-photo-slot">
              {avatar ? (
                <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div className="slot-avatar">
                  {role === 'Administrator' ? 'A' : 'R'}
                </div>
              )}
            </div>

            <div className="badge-footer-info">
              <span className="badge-welcome-lbl">WELCOME BACK</span>
              <span className="badge-username">{displayName || 'Mani272'}</span>
              <div className="badge-role-tag">
                <span className="role-tag-bullet" />
                {role}
              </div>
            </div>

            <div className="badge-barcode">
              <div className="bar" style={{ width: '4px' }} />
              <div className="bar" style={{ width: '1px' }} />
              <div className="bar" style={{ width: '3px' }} />
              <div className="bar" style={{ width: '2px' }} />
              <div className="bar" style={{ width: '5px' }} />
              <div className="bar" style={{ width: '1px' }} />
              <div className="bar" style={{ width: '4px' }} />
              <div className="bar" style={{ width: '2px' }} />
              <div className="bar" style={{ width: '3px' }} />
            </div>
          </motion.div>

          <span className="welcome-drag-instructions">
            Drag the ID card around! Here's what's new since your last visit.
          </span>
        </div>

        {/* RIGHT COLUMN: New Announcements Panel */}
        <div className="welcome-announcements-column">
          <div className="announcements-panel-card">
            <div className="panel-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="bell-icon"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              <h3 className="panel-title">New Announcements</h3>
              <span className="announcements-count">3</span>
            </div>

            <div className="announcements-list">

              <div className="announcement-item">
                <div className="announcement-meta">
                  <span className="bullet-active" />
                  <span className="announcement-name">Added Region Bypass</span>
                  <span className="announcement-date">7/27/2026</span>
                </div>
                <p className="announcement-desc">Added Region Bypass successfully for all active instances.</p>
              </div>

              <div className="announcement-item">
                <div className="announcement-meta">
                  <span className="bullet-active" />
                  <span className="announcement-name">Bypass Related</span>
                  <span className="announcement-date">7/20/2026</span>
                </div>
                <p className="announcement-desc">All admins Please don't use Mani 272 Wait For Update.</p>
              </div>

              <div className="announcement-item">
                <div className="announcement-meta">
                  <span className="bullet-active" />
                  <span className="announcement-name">WebsiteUpdate</span>
                  <span className="announcement-date">7/6/2026</span>
                </div>
                <p className="announcement-desc">Updated Mani 272 Website Theme and assets layout.</p>
              </div>

            </div>
          </div>
        </div>

      </div>

      <div className="welcome-overlay-footer" onClick={onClose}>
        Click anywhere or press "Continue" to dismiss
      </div>
    </div>
  );
}
