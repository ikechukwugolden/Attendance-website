import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

// Ensure 'export' is here to fix the "does not provide an export name" error
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUser({ ...currentUser, ...userDoc.data() });
          } else {
            setUser(currentUser); // Fallback if no Firestore doc exists
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Firebase Error:", error);
        setUser(currentUser); 
      } finally {
        setLoading(false); // Clears the blank screen state
      }
    });

    return () => unsubscribe();
  }, []);

  // The return statement MUST be outside useEffect
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Ensure 'export' is here as well
export const useAuth = () => useContext(AuthContext);