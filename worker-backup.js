
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const origin = request.headers.get("Origin");

        const allowedOrigins = [
            "http://127.0.0.1:5500",
            "http://localhost:5500",
            "https://test-f6a29.web.app"
        ];

        const corsHeaders = {
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Vary": "Origin"
        };

        if (allowedOrigins.includes(origin)) {
            corsHeaders["Access-Control-Allow-Origin"] = origin;
        }

        const respond = (data, status = 200) =>
            new Response(JSON.stringify(data), {
                status,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json; charset=utf-8",
                    "Cache-Control": "no-store"
                }
            });

        if (request.method === "OPTIONS") {
            if (!allowedOrigins.includes(origin)) {
                return new Response(null, { status: 403 });
            }

            return new Response(null, {
                status: 204,
                headers: corsHeaders
            });
        }

        if (origin && !allowedOrigins.includes(origin)) {
            return respond({
                success: false,
                message: "Origin not allowed"
            }, 403);
        }

        const FIRESTORE_BASE =
            "https://firestore.googleapis.com/v1/projects/smart-company-a9e79/databases/(default)/documents/";

        async function authenticate(token) {
            if (!env.FIREBASE_API_KEY || !token) {
                return null;
            }

            const response = await fetch(
                "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" +
                    encodeURIComponent(env.FIREBASE_API_KEY),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ idToken: token })
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.users?.[0]?.localId) {
                return null;
            }

            return data.users[0].localId;
        }

        function getBearerToken() {
            const authorization =
                request.headers.get("Authorization") || "";

            const match = authorization.match(/^Bearer\s+(.+)$/i);
            return match ? match[1] : null;
        }

        async function readFirestore(path, token) {
            const response = await fetch(
                FIRESTORE_BASE + path,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.status === 404) {
                return {
                    ok: true,
                    exists: false,
                    document: null
                };
            }

            if (!response.ok) {
                return {
                    ok: false,
                    exists: false,
                    document: null,
                    status: response.status
                };
            }

            return {
                ok: true,
                exists: true,
                document: await response.json()
            };
        }

        async function readShare(shareId) {
            const raw = await env.LOCKERS_KV.get(`share:${shareId}`);

            if (!raw) {
                return null;
            }

            try {
                return JSON.parse(raw);
            } catch {
                return null;
            }
        }

        function validShareId(shareId) {
            return typeof shareId === "string" &&
                /^[0-9a-f-]{36}$/i.test(shareId);
        }

        function shareIsValid(record, shareId) {
            return Boolean(
                record &&
                record.shareId === shareId &&
                record.revoked !== true &&
                Number.isFinite(record.expiresAt) &&
                Date.now() < record.expiresAt
            );
        }

        async function checkCompanyMember(companyId, uid, token) {
            const result = await readFirestore(
                `companies/${encodeURIComponent(companyId)}/members/${encodeURIComponent(uid)}`,
                token
            );

            return result.ok && result.exists;
        }

        async function verifyLockerOwner(companyId, roomId, uid, token) {
            const result = await readFirestore(
                `companies/${encodeURIComponent(companyId)}/chatRooms/${encodeURIComponent(roomId)}`,
                token
            );

            if (!result.ok || !result.exists) {
                return false;
            }

            return result.document.fields?.ownerId?.stringValue === uid;
        }

        if (url.pathname === "/test-binding" && request.method === "GET") {
            if (!env.LOCKERS_KV) {
                return respond({
                    success: false,
                    message: "LOCKERS_KV binding is missing"
                }, 500);
            }

            return respond({
                success: true,
                message: "LOCKERS_KV binding is connected"
            });
        }

        if (url.pathname === "/auth-check" && request.method === "POST") {
            const token = getBearerToken();

            if (!token) {
                return respond({
                    success: false,
                    message: "Firebase ID token is required"
                }, 401);
            }

            const uid = await authenticate(token);

            if (!uid) {
                return respond({
                    success: false,
                    message: "Invalid or expired Firebase ID token"
                }, 401);
            }

            return respond({
                success: true,
                authenticated: true,
                uid
            });
        }

        if (
            url.pathname === "/locker-access-check" &&
            request.method === "POST"
        ) {
            const token = getBearerToken();

            if (!token) {
                return respond({
                    success: false,
                    message: "Firebase ID token is required"
                }, 401);
            }

            let body;

            try {
                body = await request.json();
            } catch {
                return respond({
                    success: false,
                    message: "Invalid JSON body"
                }, 400);
            }

            const { companyId, roomId } = body || {};

            if (
                typeof companyId !== "string" ||
                typeof roomId !== "string" ||
                !/^[A-Za-z0-9_-]{1,128}$/.test(companyId) ||
                !/^[A-Za-z0-9_-]{1,128}$/.test(roomId)
            ) {
                return respond({
                    success: false,
                    message: "Invalid companyId or roomId"
                }, 400);
            }

            try {
                const uid = await authenticate(token);

                if (!uid) {
                    return respond({
                        success: false,
                        message: "Invalid or expired Firebase ID token"
                    }, 401);
                }

                const companyResult = await readFirestore(
                    `companies/${encodeURIComponent(companyId)}`,
                    token
                );

                if (!companyResult.ok || !companyResult.exists) {
                    return respond({
                        success: false,
                        message: "Company unavailable or access denied"
                    }, 403);
                }

                const ownerId =
                    companyResult.document.fields?.ownerId?.stringValue;

                const isOwner = ownerId === uid;

                const roomResult = await readFirestore(
                    `companies/${encodeURIComponent(companyId)}/chatRooms/${encodeURIComponent(roomId)}`,
                    token
                );

                if (!roomResult.ok || !roomResult.exists) {
                    return respond({
                        success: false,
                        message: "Locker unavailable or access denied"
                    }, 403);
                }

                if (!isOwner && roomId !== uid) {
                    return respond({
                        success: false,
                        message: "You cannot access this locker"
                    }, 403);
                }

                if (!isOwner) {
                    const isMember = await checkCompanyMember(
                        companyId,
                        uid,
                        token
                    );

                    if (!isMember) {
                        return respond({
                            success: false,
                            message: "Company membership could not be verified"
                        }, 403);
                    }
                }

                return respond({
                    success: true,
                    authenticated: true,
                    authorized: true,
                    lockerAccess: "allowed"
                });
            } catch (error) {
                console.error("locker-access-check failed:", error);

                return respond({
                    success: false,
                    message: "Unable to verify locker permissions"
                }, 502);
            }
        }

        if (
            url.pathname === "/locker-owner-check" &&
            request.method === "POST"
        ) {
            const token = getBearerToken();

            if (!token) {
                return respond({
                    success: false,
                    message: "Firebase ID token is required"
                }, 401);
            }

            let body;

            try {
                body = await request.json();
            } catch {
                return respond({
                    success: false,
                    message: "Invalid JSON body"
                }, 400);
            }

            const { companyId, roomId } = body || {};

            if (
                typeof companyId !== "string" ||
                typeof roomId !== "string" ||
                !/^[A-Za-z0-9_-]{1,128}$/.test(companyId) ||
                !/^[A-Za-z0-9_-]{1,128}$/.test(roomId)
            ) {
                return respond({
                    success: false,
                    message: "Invalid companyId or roomId"
                }, 400);
            }

            try {
                const uid = await authenticate(token);

                if (!uid) {
                    return respond({
                        success: false,
                        message: "Invalid or expired Firebase ID token"
                    }, 401);
                }

                const isOwner = await verifyLockerOwner(
                    companyId,
                    roomId,
                    uid,
                    token
                );

                if (!isOwner) {
                    return respond({
                        success: false,
                        owner: false,
                        message: "Only the locker owner can create a share"
                    }, 403);
                }

                return respond({
                    success: true,
                    owner: true,
                    message: "Locker ownership verified"
                });
            } catch (error) {
                console.error("locker-owner-check failed:", error);

                return respond({
                    success: false,
                    message: "Unable to verify locker ownership"
                }, 502);
            }
        }

        if (
            url.pathname === "/test-kv-roundtrip" &&
            request.method === "POST"
        ) {
            if (!env.LOCKERS_KV) {
                return respond({
                    success: false,
                    message: "LOCKERS_KV binding is missing"
                }, 500);
            }

            const token = getBearerToken();

            if (!token) {
                return respond({
                    success: false,
                    message: "Firebase ID token is required"
                }, 401);
            }

            try {
                const uid = await authenticate(token);

                if (!uid) {
                    return respond({
                        success: false,
                        message: "Invalid or expired Firebase ID token"
                    }, 401);
                }

                const key = "diagnostics/roundtrip-" + crypto.randomUUID();
                const testValue = "kv-test-" + crypto.randomUUID();

                let writeSucceeded = false;
                let readSucceeded = false;
                let cleanupSucceeded = false;

                try {
                    await env.LOCKERS_KV.put(key, testValue);
                    writeSucceeded = true;

                    readSucceeded =
                        (await env.LOCKERS_KV.get(key)) === testValue;
                } finally {
                    await env.LOCKERS_KV.delete(key);
                    cleanupSucceeded =
                        (await env.LOCKERS_KV.get(key)) === null;
                }

                const success =
                    writeSucceeded &&
                    readSucceeded &&
                    cleanupSucceeded;

                return respond({
                    success,
                    writeSucceeded,
                    readSucceeded,
                    cleanupSucceeded,
                    message: success
                        ? "KV write, read, and cleanup succeeded"
                        : "KV round-trip test failed"
                });
            } catch (error) {
                console.error("test-kv-roundtrip failed:", error);

                return respond({
                    success: false,
                    message: "KV test failed; check Worker logs"
                }, 500);
            }
        }

        if (
            url.pathname === "/locker-share-create" &&
            request.method === "POST"
        ) {
            if (!env.LOCKERS_KV || !env.FIREBASE_API_KEY) {
                return respond({
                    success: false,
                    message: "Required configuration is missing"
                }, 500);
            }

            const token = getBearerToken();

            if (!token) {
                return respond({
                    success: false,
                    message: "Firebase ID token is required"
                }, 401);
            }

            let body;

            try {
                body = await request.json();
            } catch {
                return respond({
                    success: false,
                    message: "Invalid JSON body"
                }, 400);
            }

            const {
                companyId,
                roomId,
                recipientUid,
                sharePassword,
                durationMinutes
            } = body || {};

            if (
                typeof companyId !== "string" ||
                typeof roomId !== "string" ||
                !/^[A-Za-z0-9_-]{1,128}$/.test(companyId) ||
                !/^[A-Za-z0-9_-]{1,128}$/.test(roomId)
            ) {
                return respond({
                    success: false,
                    message: "Invalid company or locker ID"
                }, 400);
            }

            if (
                typeof recipientUid !== "string" ||
                recipientUid.length < 1 ||
                recipientUid.length > 128
            ) {
                return respond({
                    success: false,
                    message: "Invalid recipient"
                }, 400);
            }

            if (
                typeof sharePassword !== "string" ||
                sharePassword.length < 10 ||
                sharePassword.length > 128
            ) {
                return respond({
                    success: false,
                    message: "Share password must be 10–128 characters"
                }, 400);
            }

            if (
                !Number.isInteger(durationMinutes) ||
                durationMinutes < 5 ||
                durationMinutes > 10080
            ) {
                return respond({
                    success: false,
                    message: "Duration must be between 5 minutes and 7 days"
                }, 400);
            }

            try {
                const uid = await authenticate(token);

                if (!uid) {
                    return respond({
                        success: false,
                        message: "Invalid or expired Firebase ID token"
                    }, 401);
                }

                if (recipientUid === uid) {
                    return respond({
                        success: false,
                        message: "Choose another recipient"
                    }, 400);
                }

                const isOwner = await verifyLockerOwner(
                    companyId,
                    roomId,
                    uid,
                    token
                );

                if (!isOwner) {
                    return respond({
                        success: false,
                        message: "Only the locker owner can create a share"
                    }, 403);
                }

                const memberResult = await readFirestore(
                    `companies/${encodeURIComponent(companyId)}/members/${encodeURIComponent(recipientUid)}`,
                    token
                );

                if (!memberResult.ok || !memberResult.exists) {
                    return respond({
                        success: false,
                        message: "Recipient is not a verified company member"
                    }, 403);
                }

                const salt = crypto.getRandomValues(new Uint8Array(16));

                const passwordKey = await crypto.subtle.importKey(
                    "raw",
                    new TextEncoder().encode(sharePassword),
                    "PBKDF2",
                    false,
                    ["deriveBits"]
                );

                const derivedBits = await crypto.subtle.deriveBits(
                    {
                        name: "PBKDF2",
                        salt,
                        iterations: 100000,
                        hash: "SHA-256"
                    },
                    passwordKey,
                    256
                );

                const toHex = bytes =>
                    Array.from(new Uint8Array(bytes))
                        .map(byte => byte.toString(16).padStart(2, "0"))
                        .join("");

                const shareId = crypto.randomUUID();
                const createdAt = Date.now();
                const expiresAt =
                    createdAt + durationMinutes * 60 * 1000;

                const record = {
                    version: 1,
                    shareId,
                    ownerUid: uid,
                    recipientUid,
                    companyId,
                    roomId,
                    passwordSalt: toHex(salt),
                    passwordVerifier: toHex(derivedBits),
                    passwordIterations: 100000,
                    createdAt,
                    expiresAt,
                    revoked: false,
                    selectedFiles: [],
                    status: "pending_files"
                };

                await env.LOCKERS_KV.put(
                    `share:${shareId}`,
                    JSON.stringify(record),
                    {
                        expirationTtl: durationMinutes * 60
                    }
                );

                return respond({
                    success: true,
                    shareId,
                    expiresAt,
                    status: "pending_files",
                    message: "Share record created"
                });
            } catch (error) {
                console.error("locker-share-create failed:", error);

                return respond({
                    success: false,
                    message: "Unable to create share record; check Worker logs"
                }, 500);
            }
        }

        if (
            url.pathname === "/locker-share-file-save" &&
            request.method === "POST"
        ) {
            if (!env.LOCKERS_KV || !env.FIREBASE_API_KEY) {
                return respond({
                    success: false,
                    message: "Required configuration is missing"
                }, 500);
            }

            const token = getBearerToken();

            if (!token) {
                return respond({
                    success: false,
                    message: "Firebase ID token is required"
                }, 401);
            }

            let body;

            try {
                body = await request.json();
            } catch {
                return respond({
                    success: false,
                    message: "Invalid JSON body"
                }, 400);
            }

            const {
                shareId,
                fileId,
                fileName,
                mimeType,
                encryptedData
            } = body || {};

            if (
                !validShareId(shareId) ||
                typeof fileId !== "string" ||
                !/^[A-Za-z0-9_-]{1,128}$/.test(fileId) ||
                typeof fileName !== "string" ||
                fileName.length < 1 ||
                fileName.length > 200 ||
                typeof mimeType !== "string" ||
                mimeType.length > 150 ||
                typeof encryptedData !== "string" ||
                encryptedData.length < 1 ||
                encryptedData.length > 1000000 ||
                !/^[A-Za-z0-9+/]+={0,2}$/.test(encryptedData)
            ) {
                return respond({
                    success: false,
                    message: "Invalid file data or file exceeds the test limit"
                }, 400);
            }

            try {
                const uid = await authenticate(token);

                if (!uid) {
                    return respond({
                        success: false,
                        message: "Invalid Firebase ID token"
                    }, 401);
                }

                const record = await readShare(shareId);

                if (
                    !shareIsValid(record, shareId) ||
                    record.ownerUid !== uid ||
                    !["pending_files", "active"].includes(record.status)
                ) {
                    return respond({
                        success: false,
                        message: "Share is unavailable or access is denied"
                    }, 403);
                }

                const isOwner = await verifyLockerOwner(
                    record.companyId,
                    record.roomId,
                    uid,
                    token
                );

                if (!isOwner) {
                    return respond({
                        success: false,
                        message: "Locker ownership verification failed"
                    }, 403);
                }

                if (
                    !Array.isArray(record.selectedFiles) ||
                    record.selectedFiles.length > 10
                ) {
                    return respond({
                        success: false,
                        message: "Invalid share file list"
                    }, 400);
                }

                const existingIndex = record.selectedFiles.findIndex(
                    file => file.fileId === fileId
                );

                if (
                    existingIndex < 0 &&
                    record.selectedFiles.length >= 10
                ) {
                    return respond({
                        success: false,
                        message: "The share is limited to 10 files"
                    }, 400);
                }

                const remainingSeconds = Math.floor(
                    (record.expiresAt - Date.now()) / 1000
                );

                if (remainingSeconds <= 0) {
                    return respond({
                        success: false,
                        message: "Share expired"
                    }, 403);
                }

                const fileRecord = {
                    version: 1,
                    shareId,
                    fileId,
                    fileName,
                    mimeType,
                    encryptedData,
                    savedAt: Date.now()
                };

                await env.LOCKERS_KV.put(
                    `sharefile:${shareId}:${fileId}`,
                    JSON.stringify(fileRecord),
                    {
                        expirationTtl: remainingSeconds
                    }
                );

                const selectedFile = {
                    fileId,
                    fileName,
                    mimeType,
                    encryptedLength: encryptedData.length
                };

                if (existingIndex >= 0) {
                    record.selectedFiles[existingIndex] = selectedFile;
                } else {
                    record.selectedFiles.push(selectedFile);
                }

                record.status = "active";

                await env.LOCKERS_KV.put(
                    `share:${shareId}`,
                    JSON.stringify(record),
                    {
                        expirationTtl: remainingSeconds
                    }
                );

                return respond({
                    success: true,
                    fileId,
                    message: "Encrypted file saved"
                });
            } catch (error) {
                console.error("locker-share-file-save failed:", error);

                return respond({
                    success: false,
                    message: "Unable to save encrypted file"
                }, 500);
            }
        }

        if (
            url.pathname === "/locker-share-verify" &&
            request.method === "POST"
        ) {
            return handleShareAccess(request, env, respond, {
                getBearerToken,
                authenticate,
                readShare,
                shareIsValid,
                readFirestore,
                checkCompanyMember,
                FIRESTORE_BASE,
                mode: "verify"
            });
        }

        if (
            url.pathname === "/locker-share-files" &&
            request.method === "POST"
        ) {
            return handleShareAccess(request, env, respond, {
                getBearerToken,
                authenticate,
                readShare,
                shareIsValid,
                readFirestore,
                checkCompanyMember,
                FIRESTORE_BASE,
                mode: "files"
            });
        }

        return respond({
            success: false,
            message: "Route not found"
        }, 404);
    }
};

async function handleShareAccess(request, env, respond, helpers) {
    if (!env.LOCKERS_KV || !env.FIREBASE_API_KEY) {
        return respond({
            success: false,
            message: "Required configuration is missing"
        }, 500);
    }

    const token = helpers.getBearerToken();

    if (!token) {
        return respond({
            success: false,
            message: "Firebase ID token is required"
        }, 401);
    }

    let body;

    try {
        body = await request.json();
    } catch {
        return respond({
            success: false,
            message: "Invalid JSON body"
        }, 400);
    }

    const { shareId, sharePassword } = body || {};

    if (
        typeof shareId !== "string" ||
        !/^[0-9a-f-]{36}$/i.test(shareId) ||
        typeof sharePassword !== "string" ||
        sharePassword.length < 1 ||
        sharePassword.length > 128
    ) {
        return respond({
            success: false,
            message: "Invalid share credentials"
        }, 400);
    }

    try {
        const uid = await helpers.authenticate(token);

        if (!uid) {
            return respond({
                success: false,
                message: "Invalid or expired Firebase ID token"
            }, 401);
        }

        const record = await helpers.readShare(shareId);

        if (!record) {
            return respond({
                success: false,
                message: "Share unavailable or expired"
            }, 404);
        }

        if (
            typeof record.recipientUid !== "string" ||
            record.recipientUid !== uid
        ) {
            return respond({
                success: false,
                message: "This share is not assigned to this user"
            }, 403);
        }

        if (!helpers.shareIsValid(record, shareId)) {
            return respond({
                success: false,
                message: "Share unavailable or expired"
            }, 403);
        }

        if (
            typeof record.companyId !== "string" ||
            typeof record.ownerUid !== "string" ||
            typeof record.passwordSalt !== "string" ||
            !/^[0-9a-f]{32}$/i.test(record.passwordSalt) ||
            typeof record.passwordVerifier !== "string" ||
            !/^[0-9a-f]{64}$/i.test(record.passwordVerifier) ||
            record.passwordIterations !== 100000
        ) {
            return respond({
                success: false,
                message: "Invalid share record"
            }, 403);
        }

        const companyResult = await helpers.readFirestore(
            `companies/${encodeURIComponent(record.companyId)}`,
            token
        );

        if (!companyResult.ok || !companyResult.exists) {
            return respond({
                success: false,
                message: "Company access denied"
            }, 403);
        }

        const companyOwner =
            companyResult.document.fields?.ownerId?.stringValue;

        if (companyOwner !== uid) {
            const isMember = await helpers.checkCompanyMember(
                record.companyId,
                uid,
                token
            );

            if (!isMember) {
                return respond({
                    success: false,
                    message: "Company membership could not be verified"
                }, 403);
            }
        }

        const salt = new Uint8Array(
            record.passwordSalt.match(/.{2}/g).map(
                byte => parseInt(byte, 16)
            )
        );

        const passwordKey = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(sharePassword),
            "PBKDF2",
            false,
            ["deriveBits"]
        );

        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: "PBKDF2",
                salt,
                iterations: record.passwordIterations,
                hash: "SHA-256"
            },
            passwordKey,
            256
        );

        const calculatedVerifier = Array.from(
            new Uint8Array(derivedBits)
        ).map(byte => byte.toString(16).padStart(2, "0")).join("");

        if (calculatedVerifier !== record.passwordVerifier) {
            return respond({
                success: false,
                message: "Incorrect share password"
            }, 403);
        }

        if (helpers.mode === "verify") {
            return respond({
                success: true,
                passwordVerified: true,
                status: record.status,
                filesAvailable:
                    record.status === "active" &&
                    Array.isArray(record.selectedFiles) &&
                    record.selectedFiles.length > 0,
                message: "Password verified"
            });
        }

        if (
            record.status !== "active" ||
            !Array.isArray(record.selectedFiles) ||
            record.selectedFiles.length === 0 ||
            record.selectedFiles.length > 10
        ) {
            return respond({
                success: true,
                passwordVerified: true,
                filesAvailable: false,
                files: [],
                message: "No shared files are available"
            });
        }

        const files = [];

        for (const item of record.selectedFiles) {
            if (
                !item ||
                typeof item.fileId !== "string" ||
                !/^[A-Za-z0-9_-]{1,128}$/.test(item.fileId)
            ) {
                continue;
            }

            const rawFile = await env.LOCKERS_KV.get(
                `sharefile:${shareId}:${item.fileId}`
            );

            if (!rawFile) {
                continue;
            }

            let fileRecord;

            try {
                fileRecord = JSON.parse(rawFile);
            } catch {
                continue;
            }

            if (
                fileRecord.shareId !== shareId ||
                fileRecord.fileId !== item.fileId ||
                typeof fileRecord.encryptedData !== "string"
            ) {
                continue;
            }

            files.push({
                fileId: fileRecord.fileId,
                fileName: fileRecord.fileName,
                mimeType: fileRecord.mimeType,
                encryptedData: fileRecord.encryptedData
            });
        }

        return respond({
            success: true,
            passwordVerified: true,
            filesAvailable: files.length > 0,
            status: record.status,
            files
        });
    } catch (error) {
        console.error("Locker share access failed:", error);

        return respond({
            success: false,
            message: "Unable to process shared files"
        }, 500);
    }
}

