import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          // Fetch the extra profile data we stored in Firestore
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Merge Firebase Auth (email/uid) with Firestore (role/businessName/photo)
            setUser({ 
              uid: currentUser.uid,
              email: currentUser.email,
              ...userData 
            });
          } else {
            setUser(currentUser); 
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth Context Sync Error:", error);
        setUser(currentUser); 
      } finally {
        setLoading(false); 
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);