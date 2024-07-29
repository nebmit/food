import * as dataService from "$lib/server/dataService";
import * as crypto from "crypto";

const WEBHOOK_SECRET: string = process.env.WEBHOOK_SECRET || "";

const verify_signature = async (req: Request) => {
    const signature = crypto
        .createHmac("sha256", WEBHOOK_SECRET)
        .update(JSON.stringify(await req.json()))
        .digest("hex");
    const trusted = Buffer.from(`sha256=${signature}`, 'ascii');
    const untrusted = Buffer.from(req.headers.get("x-hub-signature-256") || '', 'ascii');
    if (trusted.length !== untrusted.length) {
        return false;
    }
    return crypto.timingSafeEqual(trusted, untrusted);
};

let isUpdating = false;
async function debouncedUpdateDatabase() {
    if (isUpdating) {
        return;
    }

    isUpdating = true;

    try {
        await dataService.updateDatabase();
    } catch (error) {
        console.error('Error updating database:', error);
    } finally {
        isUpdating = false;
    }
}

export async function POST({ request }) {
    // Verify the webhook signature
    if (! await verify_signature(request)) {
        return new Response("Unauthorized", { status: 401 });
    }

    // Update the database
    debouncedUpdateDatabase();


    // Return a success response
    return new Response(null, { status: 200 });
}
