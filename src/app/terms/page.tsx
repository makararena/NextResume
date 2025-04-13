import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function Page() {
  return (
    <main className="mx-auto max-w-prose space-y-6 p-3 py-6">
      <h1 className="text-center text-2xl font-bold">Terms of Service</h1>
      <p className="text-center text-sm text-muted-foreground">
        Effective Date: Oct 31, 2024
      </p>
      <p>
        Welcome to AI Resume Builder. These Terms of Service (&quot;Terms&quot;)
        govern your use of our website and services, including any paid
        subscription plans. By accessing or using AI Resume Builder (&quot;the
        Service&quot;), you agree to be bound by these Terms. If you do not
        agree to these Terms, do not use the Service.
      </p>
      
      <div className="flex items-center gap-2">
        <input type="checkbox" checked readOnly className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <h2 className="text-xl font-semibold">1. Overview</h2>
      </div>
      <p>
        AI Resume Builder is a platform that provides resume-building tools
        powered by artificial intelligence. We offer both a free tier and paid
        subscription plans (&quot;Paid Plans&quot;). Payments for Paid Plans are
        processed through Stripe, our third-party payment provider.
      </p>
      
      <div className="flex items-center gap-2">
        <input type="checkbox" checked readOnly className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <h2 className="text-xl font-semibold">2. Eligibility</h2>
      </div>
      <p>
        You must be at least 18 years old and capable of entering into legally
        binding contracts to use this Service. By accessing the Service, you
        confirm that you meet this eligibility requirement.
      </p>
      
      <h2 className="text-xl font-semibold">3. Account Registration</h2>
      <p>
        To access some features of the Service, including Paid Plans, you must
        create an account. When registering, you agree to provide accurate and
        current information. You are responsible for maintaining the security of
        your account and password. We are not liable for any loss or damage
        resulting from unauthorized access to your account.
      </p>
      
      <div className="flex items-center gap-2">
        <input type="checkbox" checked readOnly className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <h2 className="text-xl font-semibold">4. Free Tier</h2>
      </div>
      <p>
        We offer a free tier of the Service that includes limited access to
        certain features. While on the free tier, you can create resumes with
        basic functionality. Some advanced features and templates may only be
        available to Paid Plan subscribers.
      </p>
      
      <h2 className="text-xl font-semibold">5. Paid Subscription Plans</h2>
      <p>
        If you choose to upgrade to a Paid Plan, you will be required to provide
        payment details via Stripe. All payments are processed securely by
        Stripe in accordance with their terms and privacy policy. By
        subscribing, you agree to the following terms:
      </p>
      <ul className="list-inside list-disc">
        <li>
          <strong>Subscription Fees:</strong> Fees for Paid Plans are billed on
          a recurring basis (monthly or annually) depending on the subscription
          plan you select. Prices may vary depending on your location and are
          subject to change with prior notice.
        </li>
        <li>
          <strong>Payment Method:</strong> You must provide a valid payment
          method (credit card, debit card, etc.) to subscribe to a Paid Plan.
          Your subscription will automatically renew unless you cancel before
          the renewal date.
        </li>
        <li>
          <strong>Refund Policy:</strong> AI Resume Builder does not offer
          refunds for any payments already processed. However, you can cancel
          your subscription at any time, and you will continue to have access to
          the Paid Plan features until the end of your current billing period.
        </li>
      </ul>
      
      <div className="flex items-center gap-2">
        <input type="checkbox" checked readOnly className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <h2 className="text-xl font-semibold">6. Data Processing Consent</h2>
      </div>
      <p>
        By using AI Resume Builder, you consent to:
      </p>
      <ul className="list-inside list-disc">
        <li>The collection and processing of your resume data by our AI systems</li>
        <li>The storage of your resume information on our secure servers</li>
        <li>The generation of optimized content based on your original resume</li>
        <li>The processing of any images or documents you upload to our platform</li>
      </ul>
      
      <h2 className="text-xl font-semibold">7. Intellectual Property</h2>
      <p>
        All content, trademarks, logos, and intellectual property related to 
        AI Resume Builder are owned by AI Resume Builder or its licensors. You
        agree not to infringe on these rights.
      </p>
      
      <h2 className="text-xl font-semibold">8. User Content</h2>
      <p>
        By using the Service, you grant AI Resume Builder a non-exclusive,
        worldwide, royalty-free license to use, modify, and display any content
        you create using the platform (such as resumes) solely for the purpose
        of providing the Service. You retain all ownership of your content.
      </p>
      
      <div className="flex items-center gap-2">
        <input type="checkbox" checked readOnly className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <h2 className="text-xl font-semibold">9. Privacy Policy</h2>
      </div>
      <p>
        Your privacy is important to us. Please review our <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a> to understand how we collect, use, and protect your personal
        information.
      </p>
      
      <h2 className="text-xl font-semibold">10. Disclaimer of Warranties</h2>
      <p>
        The Service is provided on an &quot;as is&quot; and &quot;as
        available&quot; basis. AI Resume Builder makes no warranties, express or
        implied, regarding the Service, including but not limited to the
        accuracy of resume outputs, the suitability of resumes for job
        applications, or the uninterrupted availability of the Service.
      </p>
      
      <div className="flex items-center gap-2">
        <input type="checkbox" checked readOnly className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <h2 className="text-xl font-semibold">11. Limitation of Liability</h2>
      </div>
      <p>
        To the fullest extent permitted by law, AI Resume Builder shall not be
        liable for any indirect, incidental, consequential, or punitive damages,
        including loss of profits, data, or business opportunities, arising out
        of or related to your use of the Service.
      </p>
      
      <h2 className="text-xl font-semibold">12. Changes to the Terms</h2>
      <p>
        We may update these Terms from time to time. Any changes will be posted
        on this page, and the &quot;Effective Date&quot; will be updated
        accordingly. Your continued use of the Service after the changes take
        effect will constitute your acceptance of the new Terms.
      </p>
      
      <h2 className="text-xl font-semibold">13. Contact Us</h2>
      <p>
        If you have any questions about these Terms, please contact us at
        support@airesumebuilder.com.
      </p>
      
      <p className="mt-8 text-center text-sm text-muted-foreground">
        By using AI Resume Builder, you acknowledge that you have read,
        understood, and agree to these Terms of Service.
      </p>
    </main>
  );
} 