import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Mail, Phone, Lock, User, ArrowLeft, Zap, Eye, EyeOff } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";
import { useAuth } from "../context/AuthContext";

const AuthPage = () => {
  const navigate = useNavigate();
  const { register, verifyOtp, login } = useAuth();
  
  const [mode, setMode] = useState("login"); // login, register, otp
  const [authMethod, setAuthMethod] = useState("email"); // email, phone
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    otp: "",
    language: "en"
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = {
        name: formData.name,
        password: formData.password,
        preferred_language: formData.language,
        ...(authMethod === "email" ? { email: formData.email } : { phone: formData.phone })
      };
      
      const response = await register(data);
      setDemoOtp(response.demo_otp);
      setMode("otp");
      toast.success("Registration successful! Enter the OTP shown below.");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    
    try {
      const data = {
        otp: formData.otp,
        ...(authMethod === "email" ? { email: formData.email } : { phone: formData.phone })
      };
      
      await verifyOtp(data);
      toast.success("Verification successful!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = {
        password: formData.password,
        ...(authMethod === "email" ? { email: formData.email } : { phone: formData.phone })
      };
      
      await login(data);
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#02040A] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-15"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#02040A] via-[#02040A]/90 to-[#0D121F]" />
      <div className="absolute inset-0 grid-bg opacity-20" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <button 
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors mb-4"
            data-testid="back-to-home-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-8 h-8 text-[#00FF94]" />
            <span className="text-2xl font-rajdhani font-bold text-white">ClimateAI Hub</span>
          </div>
          <p className="text-[#94A3B8] text-sm">
            {mode === "login" ? "Sign in to your account" : mode === "register" ? "Create your account" : "Verify your identity"}
          </p>
        </div>
        
        {/* Auth Card */}
        <div className="glass-card rounded-2xl p-8">
          <AnimatePresence mode="wait">
            {mode === "otp" ? (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-xl font-rajdhani font-semibold text-white mb-2">Enter OTP</h2>
                  <p className="text-[#94A3B8] text-sm">
                    We've sent a verification code to your {authMethod}
                  </p>
                  
                  {/* Demo OTP Display */}
                  <div className="mt-4 p-4 bg-[#00FF94]/10 border border-[#00FF94]/30 rounded-lg">
                    <p className="text-xs text-[#00FF94] uppercase tracking-wider mb-1">Demo OTP (for testing)</p>
                    <p className="text-2xl font-mono font-bold text-[#00FF94]" data-testid="demo-otp-display">{demoOtp}</p>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={formData.otp}
                    onChange={(value) => setFormData(prev => ({ ...prev, otp: value }))}
                    data-testid="otp-input"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="bg-[#0D121F] border-[#00E0FF]/30 text-white" />
                      <InputOTPSlot index={1} className="bg-[#0D121F] border-[#00E0FF]/30 text-white" />
                      <InputOTPSlot index={2} className="bg-[#0D121F] border-[#00E0FF]/30 text-white" />
                      <InputOTPSlot index={3} className="bg-[#0D121F] border-[#00E0FF]/30 text-white" />
                      <InputOTPSlot index={4} className="bg-[#0D121F] border-[#00E0FF]/30 text-white" />
                      <InputOTPSlot index={5} className="bg-[#0D121F] border-[#00E0FF]/30 text-white" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                
                <Button
                  onClick={handleVerifyOtp}
                  disabled={loading || formData.otp.length !== 6}
                  className="w-full cyber-btn"
                  data-testid="verify-otp-btn"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </Button>
                
                <button
                  onClick={() => setMode("register")}
                  className="w-full text-center text-sm text-[#00E0FF] hover:underline"
                  data-testid="back-to-register-btn"
                >
                  Back to registration
                </button>
              </motion.div>
            ) : (
              <motion.form
                key={mode}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={mode === "login" ? handleLogin : handleRegister}
                className="space-y-5"
              >
                {/* Auth Method Toggle */}
                <div className="flex rounded-lg bg-[#0D121F] p-1">
                  <button
                    type="button"
                    onClick={() => setAuthMethod("email")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                      authMethod === "email" 
                        ? "bg-[#00FF94]/20 text-[#00FF94]" 
                        : "text-[#94A3B8] hover:text-white"
                    }`}
                    data-testid="auth-method-email"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMethod("phone")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                      authMethod === "phone" 
                        ? "bg-[#00FF94]/20 text-[#00FF94]" 
                        : "text-[#94A3B8] hover:text-white"
                    }`}
                    data-testid="auth-method-phone"
                  >
                    <Phone className="w-4 h-4" />
                    Phone
                  </button>
                </div>
                
                {/* Name Field (Register only) */}
                {mode === "register" && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[#94A3B8]">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="pl-10 bg-[#0D121F] border-[#00E0FF]/20 text-white placeholder:text-[#64748B] focus:border-[#00FF94]"
                        data-testid="name-input"
                      />
                    </div>
                  </div>
                )}
                
                {/* Email/Phone Field */}
                <div className="space-y-2">
                  <Label htmlFor={authMethod} className="text-[#94A3B8]">
                    {authMethod === "email" ? "Email Address" : "Phone Number"}
                  </Label>
                  <div className="relative">
                    {authMethod === "email" ? (
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    ) : (
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    )}
                    <Input
                      id={authMethod}
                      name={authMethod}
                      type={authMethod === "email" ? "email" : "tel"}
                      placeholder={authMethod === "email" ? "you@example.com" : "+1 234 567 8900"}
                      value={authMethod === "email" ? formData.email : formData.phone}
                      onChange={handleInputChange}
                      required
                      className="pl-10 bg-[#0D121F] border-[#00E0FF]/20 text-white placeholder:text-[#64748B] focus:border-[#00FF94]"
                      data-testid={`${authMethod}-input`}
                    />
                  </div>
                </div>
                
                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#94A3B8]">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      minLength={6}
                      className="pl-10 pr-10 bg-[#0D121F] border-[#00E0FF]/20 text-white placeholder:text-[#64748B] focus:border-[#00FF94]"
                      data-testid="password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white"
                      data-testid="toggle-password-btn"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                {/* Language Selection (Register only) */}
                {mode === "register" && (
                  <div className="space-y-2">
                    <Label className="text-[#94A3B8]">Preferred Language</Label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, language: "en" }))}
                        className={`flex-1 py-2 rounded-lg border text-sm transition-all ${
                          formData.language === "en"
                            ? "border-[#00FF94] bg-[#00FF94]/10 text-[#00FF94]"
                            : "border-[#00E0FF]/20 text-[#94A3B8] hover:border-[#00E0FF]/40"
                        }`}
                        data-testid="lang-en-btn"
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, language: "ta" }))}
                        className={`flex-1 py-2 rounded-lg border text-sm transition-all ${
                          formData.language === "ta"
                            ? "border-[#00FF94] bg-[#00FF94]/10 text-[#00FF94]"
                            : "border-[#00E0FF]/20 text-[#94A3B8] hover:border-[#00E0FF]/40"
                        }`}
                        data-testid="lang-ta-btn"
                      >
                        தமிழ் (Tamil)
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full cyber-btn mt-6"
                  data-testid={mode === "login" ? "login-btn" : "register-btn"}
                >
                  {loading ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
                </Button>
                
                {/* Mode Toggle */}
                <div className="text-center text-sm">
                  <span className="text-[#94A3B8]">
                    {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMode(mode === "login" ? "register" : "login")}
                    className="text-[#00E0FF] hover:underline font-medium"
                    data-testid="toggle-mode-btn"
                  >
                    {mode === "login" ? "Sign Up" : "Sign In"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
