import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  updateProfile,
  User as FirebaseUser,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
} from 'firebase/auth'
import { auth } from './config'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './config'
import { User, UserRole } from '@/types'

export const signUpWithEmail = async (
  email: string,
  password: string,
  role: UserRole,
  additionalData?: any
) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  await sendEmailVerification(user)

  const userData: User = {
    uid: user.uid,
    role,
    email: user.email!,
    createdAt: new Date(),
  }

  await setDoc(doc(db, 'users', user.uid), {
    ...userData,
    createdAt: serverTimestamp(),
  })

  if (role === 'student') {
    await setDoc(doc(db, 'students', user.uid), {
      uid: user.uid,
      name: additionalData.name || '',
      email: user.email!,
      phone: additionalData.phone || '',
      studentId: additionalData.studentId || '',
      program: additionalData.program || '',
      year: additionalData.year || 1,
      cgpa: additionalData.cgpa || 0,
      graduationDate: additionalData.graduationDate || '',
      skills: additionalData.skills || [],
      isFrozen: false,
      elitePoints: 0,
      profileCompletion: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } else if (role === 'recruiter') {
    await setDoc(doc(db, 'recruiters', user.uid), {
      uid: user.uid,
      companyName: additionalData.companyName || '',
      companyEmail: user.email!,
      phone: additionalData.phone || '',
      gstOrCin: additionalData.gstOrCin || '',
      industry: additionalData.industry || '',
      size: additionalData.size || '',
      locations: additionalData.locations || [],
      hiringTimeline: additionalData.hiringTimeline || '',
      recruiterHours: additionalData.recruiterHours || '',
      techStack: additionalData.techStack || [],
      workMode: additionalData.workMode || [],
      isVerified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  return userCredential
}

export const signInWithEmail = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password)
}

export const logout = async () => {
  return await signOut(auth)
}

export const setupPhoneVerification = (phoneNumber: string) => {
  if (typeof window === 'undefined') return null
  
  const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
    callback: () => {},
  })

  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
}

export const verifyPhoneOTP = async (verificationId: string, code: string) => {
  const credential = PhoneAuthProvider.credential(verificationId, code)
  return await signInWithCredential(auth, credential)
}

export const getUserRole = async (uid: string): Promise<UserRole | null> => {
  const userDoc = await getDoc(doc(db, 'users', uid))
  if (userDoc.exists()) {
    return userDoc.data().role as UserRole
  }
  return null
}
