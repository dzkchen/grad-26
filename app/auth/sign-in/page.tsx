import Image from "next/image";
import { signIn } from "@/lib/auth";

export default function SignInPage() {
  return (
    <div className="jf-home">
      <section className="jf-hero">
        <div className="jf-hero-bg" aria-hidden />
        <div className="jf-hero-content">
          <div className="jf-hero-tag">
            <Image src="/logo.png" alt="" width={18} height={18} priority />
            John Fraser Secondary School
          </div>
          <div className="jf-hero-big">
            SIGN
            <br />
            <span className="jf-yr">IN</span>
          </div>
          <p className="jf-hero-tagline">
            Use your @pdsb.net Google account.
          </p>
          <form
            className="jf-hero-actions"
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button type="submit" className="jf-btn-white">
              Continue with Google →
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
