import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <h4>🔗 Quick Links</h4>
          <Link href="/">Home</Link>
          <Link href="/register-case">Register a Case</Link>
          <Link href="/track-case">Track Your Case</Link>
          <Link href="/auth">Citizen Login</Link>
        </div>
        <div>
          <h4>📋 Guidelines</h4>
          <p>How to Report a Cyber Crime</p>
          <p>Types of Cyber Crimes</p>
          <p>Safe Banking Tips</p>
          <p>Online Safety for Women & Children</p>
        </div>
        <div>
          <h4>📞 Contact & Help</h4>
          <p>Helpline: <strong style={{color:'#FF9933'}}>1930</strong></p>
          <p>Email: cybercrime@gov.in</p>
          <p>24×7 Support Available</p>
        </div>
        <div>
          <h4>🏛️ Ministry</h4>
          <p>Ministry of Home Affairs</p>
          <p>I4C – Indian Cyber Crime</p>
          <p>Coordination Centre</p>
          <p>New Delhi – 110001</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 Government of India. All rights reserved. | This is an official Government portal.</p>
        <p style={{marginTop:4}}>Website Policy | Accessibility | Help | Sitemap | Terms of Use</p>
      </div>
    </footer>
  );
}
