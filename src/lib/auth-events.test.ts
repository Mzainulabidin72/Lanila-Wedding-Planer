import { describe, expect, it } from "vitest";
import { profileActionFor } from "./auth-events";

describe("keputusan profil untuk tiap event Supabase Auth", () => {
  it("tanpa user (SIGNED_OUT / sesi kedaluwarsa) selalu membersihkan profil", () => {
    for (const e of ["SIGNED_OUT", "TOKEN_REFRESHED", "SIGNED_IN", "INITIAL_SESSION", "USER_UPDATED"]) {
      expect(profileActionFor(e, false, false)).toBe("clear");
      expect(profileActionFor(e, false, true)).toBe("clear");
    }
  });

  it("TOKEN_REFRESHED dan PASSWORD_RECOVERY tidak memuat ulang", () => {
    expect(profileActionFor("TOKEN_REFRESHED", true, true)).toBe("keep");
    expect(profileActionFor("TOKEN_REFRESHED", true, false)).toBe("keep");
    expect(profileActionFor("PASSWORD_RECOVERY", true, true)).toBe("keep");
  });

  it("USER_UPDATED selalu memuat ulang", () => {
    expect(profileActionFor("USER_UPDATED", true, true)).toBe("load");
  });

  it("SIGNED_IN dan INITIAL_SESSION: muat jika profil akun ini belum termuat (ganti akun), lewati jika sudah", () => {
    expect(profileActionFor("SIGNED_IN", true, false)).toBe("load"); // akun baru / ganti akun
    expect(profileActionFor("SIGNED_IN", true, true)).toBe("keep"); // tab kembali fokus, akun sama
    expect(profileActionFor("INITIAL_SESSION", true, false)).toBe("load");
    expect(profileActionFor("INITIAL_SESSION", true, true)).toBe("keep");
  });
});
