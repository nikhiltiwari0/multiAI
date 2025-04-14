-- Function to accept a chat invitation with proper transaction handling
CREATE OR REPLACE FUNCTION public.accept_chat_invitation(invitation_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _chat_id UUID;
    _invited_user_id UUID;
    _invitation_status TEXT;
BEGIN
    -- Start a transaction for atomicity
    BEGIN
        -- First, check if the invitation exists and get its details
        SELECT chat_id, invited_user_id, status INTO _chat_id, _invited_user_id, _invitation_status
        FROM chat_invitations
        WHERE id = invitation_id;
        
        -- Check if invitation exists
        IF _chat_id IS NULL THEN
            RAISE EXCEPTION 'Invitation not found';
        END IF;
        
        -- Check if invitation is still pending
        IF _invitation_status != 'pending' THEN
            RAISE EXCEPTION 'Invitation has already been % and cannot be accepted', _invitation_status;
        END IF;
        
        -- Check if the user making the request is the invited user
        IF _invited_user_id != auth.uid() THEN
            RAISE EXCEPTION 'You are not authorized to accept this invitation';
        END IF;
        
        -- Update invitation status to 'accepted'
        UPDATE chat_invitations
        SET 
            status = 'accepted',
            updated_at = NOW()
        WHERE id = invitation_id;
        
        -- Add the user to chat_participants if not already a participant
        INSERT INTO chat_participants (chat_id, user_id, joined_at)
        VALUES (_chat_id, _invited_user_id, NOW())
        ON CONFLICT (chat_id, user_id) DO NOTHING;
        
        -- Commit the transaction
        COMMIT;
    EXCEPTION WHEN OTHERS THEN
        -- Roll back any changes if an error occurs
        ROLLBACK;
        RAISE;
    END;
END;
$$;

-- Add proper permissions to the function
GRANT EXECUTE ON FUNCTION public.accept_chat_invitation(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.accept_chat_invitation(UUID) FROM anon;

