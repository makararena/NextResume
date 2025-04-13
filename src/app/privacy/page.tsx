import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function Page() {
  return (
    <main className="mx-auto max-w-prose space-y-6 p-3 py-6">
      <h1 className="text-center text-2xl font-bold">Privacy Policy</h1>
      <p className="text-center text-sm text-muted-foreground">
        Effective Date: Oct 31, 2024
      </p>
      <p>
        Welcome to AI Resume Builder. Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
      </p>
      
      <div className="flex items-center gap-2">
        <input type="checkbox" checked readOnly className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <h2 className="text-xl font-semibold">1. Information We Collect</h2>
      </div>
      <p>
        We collect the following types of information:
      </p>
      <ul className="list-inside list-disc">
        <li>
          <strong>Personal Information:</strong> When you create an account, we collect your name, email address, and other information you provide.
        </li>
        <li>
          <strong>Resume Data:</strong> Information you provide for creating resumes, including work experience, education, skills, and other professional details.
        </li>
        <li>
          <strong>Usage Data:</strong> Information about how you interact with our service, including features used and time spent on the platform.
        </li>
        <li>
          <strong>Payment Information:</strong> If you subscribe to a paid plan, payment information is processed securely through our payment processor, Stripe.
        </li>
      </ul>
      
      <div className="flex items-center gap-2">
        <input type="checkbox" checked readOnly className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
      </div>
      <p>
        We use the collected information for various purposes:
      </p>
      <ul className="list-inside list-disc">
        <li>To provide and maintain our service</li>
        <li>To process your resume creation requests</li>
        <li>To notify you about changes to our service</li>
        <li>To provide customer support</li>
        <li>To gather analysis or valuable information to improve our service</li>
        <li>To detect, prevent, and address technical issues</li>
      </ul>
      
      <div className="flex items-center gap-2">
        <input type="checkbox" checked readOnly className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <h2 className="text-xl font-semibold">3. Data Processing and AI</h2>
      </div>
      <p>
        Our service uses artificial intelligence to help generate and optimize resumes. When you upload your existing resume or enter information:
      </p>
      <ul className="list-inside list-disc">
        <li>Your data is processed by our AI to generate tailored content</li>
        <li>We implement safeguards to protect your data during processing</li>
        <li>Your resume content is stored securely and is only accessible to you unless you choose to share it</li>
      </ul>
      
      <h2 className="text-xl font-semibold">4. Data Sharing and Disclosure</h2>
      <p>
        We may share your information in the following situations:
      </p>
      <ul className="list-inside list-disc">
        <li>
          <strong>Third-Party Service Providers:</strong> We use third parties to facilitate our service (e.g., payment processing, hosting, analytics).
        </li>
        <li>
          <strong>Business Transfers:</strong> In connection with any merger, sale of company assets, financing, or acquisition.
        </li>
        <li>
          <strong>Legal Requirements:</strong> To comply with the law, legal process, or governmental request.
        </li>
      </ul>
      
      <div className="flex items-center gap-2">
        <input type="checkbox" checked readOnly className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <h2 className="text-xl font-semibold">5. Data Security</h2>
      </div>
      <p>
        We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
      </p>
      
      <h2 className="text-xl font-semibold">6. Your Data Rights</h2>
      <p>
        Depending on your location, you may have certain rights regarding your personal data:
      </p>
      <ul className="list-inside list-disc">
        <li>Right to access your personal data</li>
        <li>Right to correct inaccurate data</li>
        <li>Right to request deletion of your data</li>
        <li>Right to restrict or object to processing</li>
        <li>Right to data portability</li>
      </ul>
      
      <h2 className="text-xl font-semibold">7. Cookies and Tracking</h2>
      <p>
        We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
      </p>
      
      <div className="flex items-center gap-2">
        <input type="checkbox" checked readOnly className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <h2 className="text-xl font-semibold">8. Children's Privacy</h2>
      </div>
      <p>
        Our service is not intended for use by individuals under the age of 18. We do not knowingly collect personally identifiable information from children.
      </p>
      
      <h2 className="text-xl font-semibold">9. Changes to This Privacy Policy</h2>
      <p>
        We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date."
      </p>
      
      <h2 className="text-xl font-semibold">10. Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us at support@airesumebuilder.com.
      </p>
    </main>
  );
} 