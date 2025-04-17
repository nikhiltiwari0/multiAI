import { ChatLayout } from "@/components/ChatLayout";
import { ChatProvider } from "@/contexts/ChatContext";
import { ThemeProvider } from "@/components/theme-provider";
import { motion } from "framer-motion";

const Index = () => {
  return (
    <ThemeProvider defaultTheme="system">
      <ChatProvider>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <ChatLayout />
        </motion.div>
      </ChatProvider>
    </ThemeProvider>
  );
};

export default Index;
